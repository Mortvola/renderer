/* eslint-disable no-restricted-syntax */
import { Vec4, mat4, quat, vec4 } from 'wgpu-matrix';
import {
  makeShaderDataDefinitions,
  makeStructuredView,
} from 'webgpu-utils';
import Camera from './Camera';
import { degToRad } from './Math';
import { isContainerNode } from './Drawables/SceneNodes/ContainerNode';
import DeferredRenderPass from './RenderPasses/DeferredRenderPass';
import Light from './Drawables/Light';
import CartesianAxes from './Drawables/CartesianAxes';
import DrawableNode from './Drawables/SceneNodes/DrawableNode';
import { SceneNodeInterface, RendererInterface, ParticleSystemInterface, ContainerNodeInterface, DrawableNodeInterface } from './types';
import { lineMaterial } from './Materials/Line';
import { lights } from "./shaders/lights";
import { gpu } from './Gpu';
import { bindGroups } from './BindGroups';
import { pipelineManager } from './Pipelines/PipelineManager';
import ForwardRenderPass from './RenderPasses/ForwardRenderPass';
import BloomPass, { createTexture } from './RenderPasses/BloomPass';
import { outputFormat } from './RenderSetings';
import RenderPass2D from './RenderPasses/RenderPass2D';
import SceneGraph2D from './SceneGraph2d';
import TransparentRenderPass2D from './RenderPasses/TransparentRenderPass2D';
import OutlinePass from './RenderPasses/OutlinePass';
import { isDrawableNode } from './Drawables/SceneNodes/utils';
import Mesh from './Drawables/Mesh';
import { plane } from './Drawables/Shapes/plane';
import { circles } from './shaders/circles';
import RangeCircle from './Drawables/RangeCircle';
import SceneGraph from './Drawables/SceneNodes/SceneGraph';
import DecalPass from './RenderPasses/DecalPass';
import CombinePass from './RenderPasses/CombinePass';

const requestPostAnimationFrame = (task: (timestamp: number) => void) => {
  requestAnimationFrame((timestamp: number) => {
    setTimeout(() => {
      task(timestamp);
    }, 0);
  });
};

const lightDefs = makeShaderDataDefinitions(lights);
const lightsStructure = makeStructuredView(lightDefs.structs.Lights);
const circlesDefs = makeShaderDataDefinitions(circles);
const circlesStructure = makeStructuredView(circlesDefs.structs.Circles);

type BindGroup = {
  bindGroup: GPUBindGroup,
  buffer: GPUBuffer[],
}

class Renderer implements RendererInterface {
  frameBindGroup: BindGroup | null = null;

  render = true;

  previousTimestamp: number | null = null;

  startFpsTime: number | null = null;

  framesRendered = 0;

  onFpsChange?: (fps: number) => void;

  camera = new Camera();

  aspectRatio = new Float32Array(1);

  context: GPUCanvasContext | null = null;

  albedoTextureView: GPUTextureView | null = null;

  decalView: GPUTextureView | null = null;

  positionTextureView: GPUTextureView | null = null;

  scratchTextureView: GPUTextureView | null = null;

  screenTextureView: GPUTextureView | null = null;

  depthTextureView: GPUTextureView | null = null;

  renderedDimensions: [number, number] = [0, 0];

  scene = new SceneGraph();

  scene2d = new SceneGraph2D();

  decalPass: DecalPass | null = null;

  deferredRenderPass: DeferredRenderPass | null = null;

  combinePass: CombinePass | null = null;

  unlitRenderPass: ForwardRenderPass | null = new ForwardRenderPass('Unlit Render Pass');

  transparentPass: ForwardRenderPass | null = new ForwardRenderPass('Transparent Render Pass');

  renderPass2D = new RenderPass2D();

  transparentRenderPass2D = new TransparentRenderPass2D();

  bloomPass: BloomPass | null = null;

  outlinePass: OutlinePass | null = null;

  outlineMesh: DrawableNodeInterface | null = null;

  lights: Light[] = [];

  circles: RangeCircle[] = [];

  particleSystems: ParticleSystemInterface[] = [];

  timeBuffer = new Float32Array(1)

  debugView = false;

  constructor(frameBindGroupLayout: GPUBindGroupLayout, cartesianAxes: DrawableNode, floor?: SceneNodeInterface) {
    this.createCameraBindGroups(frameBindGroupLayout);

    // this.reticle = reticle;

    this.aspectRatio[0] = 1.0;
    // this.scene.addNode(cartesianAxes);

    if (floor) {
      this.scene.addNode(floor);
    }

    let light = new Light()
    light.translate[0] = 0;
    light.translate[1] = 3;
    light.translate[2] = 0;
    
    this.lights.push(light)

    light = new Light()
    light.translate[0] = 15;
    light.translate[1] = 4;
    light.translate[2] = -15;

    this.lights.push(light)

    light = new Light()
    light.translate[0] = -15;
    light.translate[1] = 5;
    light.translate[2] = -15;

    this.lights.push(light)

    this.scene.updateTransforms(null);
  }

  static async create() {
    await gpu.ready();
    await pipelineManager.ready();

    const cartesianAxes = await DrawableNode.create(new CartesianAxes(), { shaderDescriptor: lineMaterial })
    
    const quad = await Mesh.create(plane(50, 50, [1, 1, 1, 1]), 0)
    const floor = await DrawableNode.create(quad, { shaderDescriptor: { lit: true }})
    floor.postTransforms.push(mat4.fromQuat(quat.fromEuler(degToRad(270), 0, 0, "xyz")))

    return new Renderer(bindGroups.getBindGroupLayout0(), cartesianAxes, floor);
  }

  async setCanvas(canvas: HTMLCanvasElement) {
    if (this.context) {
      this.context.unconfigure();
    }

    this.context = canvas.getContext('webgpu');

    if (!this.context) {
      throw new Error('context is null');
    }

    this.context.configure({
      device: gpu.device,
      format: outputFormat,
      alphaMode: 'premultiplied',
      colorSpace: 'display-p3',
    });

    this.camera.computeViewTransform();

    this.scene2d.setCanvasDimensions(canvas.width, canvas.height);
  }

  createCameraBindGroups(frameBindGroupLayout: GPUBindGroupLayout) {
    const matrixBufferSize = 16 * Float32Array.BYTES_PER_ELEMENT;

    const projectionTransformBuffer = gpu.device.createBuffer({
      label: 'projection Matrix',
      size: matrixBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const viewTransformBuffer = gpu.device.createBuffer({
      label: 'view Matrix',
      size: matrixBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const inverseViewTransformBuffer = gpu.device.createBuffer({
      label: 'inverse view Matrix',
      size: matrixBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const cameraPosBuffer = gpu.device.createBuffer({
      label: 'camera position',
      size: 4 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const aspectRatioBuffer = gpu.device.createBuffer({
      label: 'aspect ratio',
      size: 1 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const lightsBuffer = gpu.device.createBuffer({
      label: 'lights',
      size: lightsStructure.arrayBuffer.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const circlesBuffer = gpu.device.createBuffer({
      label: 'circles',
      size: circlesStructure.arrayBuffer.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const timeBuffer = gpu.device.createBuffer({
      label: 'time',
      size: 1 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const frameBindGroup = gpu.device.createBindGroup({
      label: 'frame',
      layout: frameBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: projectionTransformBuffer }},
        { binding: 1, resource: { buffer: viewTransformBuffer }},
        { binding: 2, resource: { buffer: inverseViewTransformBuffer }},
        { binding: 3, resource: { buffer: cameraPosBuffer }},
        { binding: 4, resource: { buffer: aspectRatioBuffer }},
        { binding: 5, resource: { buffer: lightsBuffer }},
        { binding: 6, resource: { buffer: circlesBuffer }},
        { binding: 7, resource: { buffer: timeBuffer }},
      ],
    });

    this.frameBindGroup = {
      bindGroup: frameBindGroup,
      buffer: [
          projectionTransformBuffer,
          viewTransformBuffer,
          inverseViewTransformBuffer,
          cameraPosBuffer,
          aspectRatioBuffer,
          lightsBuffer,
          circlesBuffer,
          timeBuffer,
      ],
    }
  }

  addSceneNode(node: SceneNodeInterface) {
    this.scene.addNode(node);
  }

  removeSceneNode(node: SceneNodeInterface) {
    this.scene.removeNode(node);
  }

  updateFrame = async (timestamp: number) => {
    if (this.render) {
      if (timestamp !== this.previousTimestamp) {
        if (this.startFpsTime === null) {
          this.startFpsTime = timestamp;
        }

        // Update the fps display every second.
        const fpsElapsedTime = timestamp - this.startFpsTime;

        // Update frames per second
        if (fpsElapsedTime > 1000) {
          const fps = this.framesRendered / (fpsElapsedTime * 0.001);
          this.onFpsChange && this.onFpsChange(fps);
          this.framesRendered = 0;
          this.startFpsTime = timestamp;
        }

        // Move the camera using the set velocity.
        if (this.previousTimestamp !== null) {
          // Get elapsed time in seconds.
          const elapsedTime = (timestamp - this.previousTimestamp) * 0.001;

          for (const particleSystem of this.particleSystems) {
            particleSystem.update(timestamp, elapsedTime, this.scene.scene)
          }

          this.camera.updatePosition(elapsedTime, timestamp);
        }

        await this.drawScene(timestamp);

        this.previousTimestamp = timestamp;
        this.framesRendered += 1;
      }

      requestPostAnimationFrame(this.updateFrame);
    }
  };

  started = false;

  start(): void {
    if (!this.started) {
      this.started = true;
      requestPostAnimationFrame(this.updateFrame);
    }
  }

  stop(): void {
    this.render = false;
  }

  async drawScene(timestamp: number) {
    if (!this.context) {
      throw new Error('context is null');
    }

    if (!this.frameBindGroup) {
      throw new Error('uniformBuffer is not set');
    }

    // this.cursor.translate[0] = this.camera.position[0];
    // this.cursor.translate[2] = this.camera.position[2];

    if (this.context.canvas.width !== this.renderedDimensions[0]
      || this.context.canvas.height !== this.renderedDimensions[1]
    ) {
      this.scene2d.setCanvasDimensions(this.context.canvas.width, this.context.canvas.height);

      const depthTexture = gpu.device.createTexture({
        size: { width: this.context.canvas.width, height: this.context.canvas.height },
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      this.depthTextureView = depthTexture.createView();

      this.albedoTextureView = createTexture(this.context).createView()
      this.positionTextureView = createTexture(this.context).createView();
      this.scratchTextureView = createTexture(this.context).createView();
      this.decalView = createTexture(this.context).createView()

      this.deferredRenderPass = new DeferredRenderPass();

      this.decalPass = new DecalPass(this.positionTextureView)

      this.combinePass = new CombinePass(this.albedoTextureView, this.positionTextureView, this.scratchTextureView, this.decalView);

      this.screenTextureView = createTexture(this.context).createView();

      this.bloomPass = new BloomPass(this.context, this.screenTextureView, this.scratchTextureView);
      
      this.outlinePass = new OutlinePass(this.scratchTextureView)

      this.aspectRatio[0] = this.context.canvas.width / this.context.canvas.height;

      this.camera.perspectiveTransform = mat4.perspective(
        degToRad(45), // settings.fieldOfView,
        this.aspectRatio[0],
        this.camera.near, // zNear
        this.camera.far, // zFar
      );

      this.camera.orthographicTransform = mat4.ortho(
        -this.context.canvas.width / 80,
        this.context.canvas.width / 80,
        -this.context.canvas.height / 80,
        this.context.canvas.height / 80,
        // this.near, this.far,
        -200,
        200,
      );

      this.renderedDimensions = [this.context.canvas.width, this.context.canvas.height];
    }

    this.scene.updateTransforms(this);

    if (this.camera.projection === 'Perspective') {
      gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[0], 0, this.camera.perspectiveTransform as Float32Array);
    } else {
      gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[0], 0, this.camera.orthographicTransform as Float32Array);
    }

    const inverseViewtransform = mat4.inverse(this.camera.viewTransform);
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[1], 0, inverseViewtransform as Float32Array);
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[2], 0, this.camera.viewTransform as Float32Array);

    // Write the camera position

    const cameraPosition = vec4.transformMat4(vec4.create(0, 0, 0, 1), this.camera.viewTransform);
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[3], 0, cameraPosition as Float32Array);
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[4], 0, this.aspectRatio as Float32Array);

    // Update the light information
    lightsStructure.set({
      numDirectional: 0,
      directional: [{
        direction: vec4.transformMat4(
          vec4.create(1, 1, 1, 0),
          inverseViewtransform,
        ),
        color: vec4.create(1, 1, 1, 1),
      }],
      numPointLights: this.lights.length,
      pointLights: this.lights.map((light) => ({
        position: vec4.transformMat4(
          vec4.create(light.translate[0], light.translate[1], light.translate[2], 1),
          inverseViewtransform,
        ),
        color: light.lightColor,
        attConstant: 1.0,
        attLinear: 0.09,
        attQuadratic: 0.032,
      })),
    });

    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[5], 0, lightsStructure.arrayBuffer);

    const circles = this.scene.getRangeCircles()

    circlesStructure.set({
      numCircles: circles.length,
      circles: circles.map((c) => ({
        position: vec4.transformMat4(
          vec4.create(0, 0, 0, 1),
          c.transform,
        ),
        color: c.color,
        radius: c.radius,
        thickness: c.thickness,
      })),
    })

    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[6], 0, circlesStructure.arrayBuffer);

    this.timeBuffer[0] = timestamp / 1000.0;
    
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[7], 0, this.timeBuffer);

    await this.scene2d.updateLayout()

    this.submitRenderPasses()
  }

  // Note: do not place any awaits in the method as it can cause microtasks to execute
  // which can impact the rendering process.
  submitRenderPasses() {
    if (this.context && this.frameBindGroup) {
      const commandEncoder = gpu.device.createCommandEncoder();

      const canvasView = this.context.getCurrentTexture().createView()

      this.deferredRenderPass!.render(
        this.albedoTextureView!,
        this.positionTextureView!,
        this.scratchTextureView!,
        this.depthTextureView!,
        commandEncoder,
        this.frameBindGroup.bindGroup,
      );

      if (this.debugView) {
        this.decalPass!.render(canvasView, this.depthTextureView!, commandEncoder, this.frameBindGroup.bindGroup)
      }
      else {
        this.decalPass!.render(this.decalView!, this.depthTextureView!, commandEncoder, this.frameBindGroup.bindGroup)

        this.combinePass!.render(
          this.screenTextureView!,
          commandEncoder,
          this.frameBindGroup.bindGroup,
        )

        const bloomView = this.bloomPass?.bloomTextureView

        this.unlitRenderPass!.render(
          this.screenTextureView!,
          bloomView!,
          false,
          this.depthTextureView!,
          commandEncoder,
          this.frameBindGroup.bindGroup,
        )

        this.transparentPass!.render(
          this.screenTextureView!,
          bloomView!,
          true,
          this.depthTextureView!,
          commandEncoder,
          this.frameBindGroup.bindGroup,
        )

        if (this.bloomPass) {
          this.bloomPass.render(canvasView, commandEncoder);      
        }

        if (this.outlinePass && this.outlineMesh) {
          this.outlinePass.render(canvasView, this.frameBindGroup.bindGroup, this.outlineMesh, commandEncoder)
        }
      }

      // this.renderPass2D.render(canvasView, this.depthTextureView!, commandEncoder, this.frameBindGroup.bindGroup, this.scene2d);
      // this.transparentRenderPass2D.render(canvasView, this.depthTextureView!, commandEncoder, this.frameBindGroup.bindGroup, this.scene2d);

      gpu.device.queue.submit([commandEncoder.finish()]);
    }
  }

  setOutlineMesh(sceneNode: ContainerNodeInterface | null): boolean {
    if (sceneNode === null) {
      this.outlineMesh = null
    }
    else {
      for (const node of sceneNode.nodes) {
        if (isDrawableNode(node)) {
          this.outlineMesh = node
          return true;
        }
        else if (isContainerNode(node)) {
          const result = this.setOutlineMesh(node);
  
          if (result) {
            return true;
          }
        }
      }  
    }

    return false;
  }

  updateDirection(direction: Vec4) {
    this.camera.moveDirection = direction;
  }

  zoomOut() {
    this.camera.offset += 1;
    this.camera.rotateX -= 1;
  }

  zoomIn() {
    this.camera.offset -= 1;
    this.camera.rotateX += 1;
  }

  addParticleSystem(particleSystem: ParticleSystemInterface): void {
    if (!this.particleSystems.some((p) => p === particleSystem)) {
      particleSystem.reset()
      this.particleSystems.push(particleSystem)
    }
  }

  removeParticleSystem(particleSystem: ParticleSystemInterface): void {
    const index = this.particleSystems.findIndex((p) => p === particleSystem)

    if (index !== -1) {
      this.particleSystems[index].removePoints(this.scene.scene)

      this.particleSystems = [
        ...this.particleSystems.slice(0, index),
        ...this.particleSystems.slice(index + 1),
      ]
    }
  }

  canvasResize(width: number, height: number, scaleX: number, scaleY: number, viewportWidth: number, viewportHeight: number) {
    this.scene2d.setCanvasDimensions(width, height, scaleX, scaleY, viewportWidth, viewportHeight)
  }

  toggleDebugView() {
    this.debugView = !this.debugView;
  }
}

export default Renderer;
