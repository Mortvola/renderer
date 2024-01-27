/* eslint-disable no-restricted-syntax */
import { Vec4, mat4, vec2, vec4 } from 'wgpu-matrix';
import {
  makeShaderDataDefinitions,
  makeStructuredView,
} from 'webgpu-utils';
import Camera from './Camera';
import { degToRad } from './Math';
import ContainerNode from './Drawables/SceneNodes/ContainerNode';
import RenderPass from './RenderPass';
import Light, { isLight } from './Drawables/Light';
import CartesianAxes from './Drawables/CartesianAxes';
import DrawableNode from './Drawables/SceneNodes/DrawableNode';
import SceneNode from './Drawables/SceneNodes/SceneNode';
import { SceneNodeInterface, RendererInterface } from './types';
import { lineMaterial } from './Materials/Line';
import { lights } from "./shaders/lights";
import { gpu } from './Gpu';
import { bindGroups } from './BindGroups';
import { pipelineManager } from './Pipelines/PipelineManager';
import TransparentRenderPass from './TransparentRenderPass';

const requestPostAnimationFrame = (task: (timestamp: number) => void) => {
  requestAnimationFrame((timestamp: number) => {
    setTimeout(() => {
      task(timestamp);
    }, 0);
  });
};

const defs = makeShaderDataDefinitions(lights);
const lightsStructure = makeStructuredView(defs.structs.Lights);

type BindGroup = {
  bindGroup: GPUBindGroup,
  buffer: GPUBuffer[],
}

class Renderer implements RendererInterface {
  initialized = false;

  frameBindGroup: BindGroup | null = null;

  render = true;

  previousTimestamp: number | null = null;

  startFpsTime: number | null = null;

  framesRendered = 0;

  onFpsChange?: (fps: number) => void;

  camera = new Camera();

  aspectRatio = new Float32Array(1);

  context: GPUCanvasContext | null = null;

  depthTextureView: GPUTextureView | null = null;

  renderedDimensions: [number, number] = [0, 0];

  scene = new ContainerNode();

  mainRenderPass = new RenderPass();

  transparentPass = new TransparentRenderPass();

  lights: Light[] = [];

  reticlePosition = vec2.create(0, 0);

  constructor(frameBindGroupLayout: GPUBindGroupLayout, cartesianAxes: DrawableNode, test?: SceneNode) {
    this.createCameraBindGroups(frameBindGroupLayout);

    // this.reticle = reticle;

    this.aspectRatio[0] = 1.0;
    this.scene.addNode(cartesianAxes);

    if (test) {
      this.scene.addNode(test);
    }

    this.updateTransforms();
  }

  static async create() {
    await gpu.ready();
    await pipelineManager.ready();

    const cartesianAxes = await DrawableNode.create(new CartesianAxes(), lineMaterial)
    
    return new Renderer(bindGroups.getBindGroupLayout0(), cartesianAxes);
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
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'opaque',
    });

    this.camera.computeViewTransform();

    this.initialized = true;
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
        { binding: 2, resource: { buffer: cameraPosBuffer }},
        { binding: 3, resource: { buffer: aspectRatioBuffer }},
        { binding: 4, resource: { buffer: lightsBuffer }},
        { binding: 5, resource: { buffer: timeBuffer }},
      ],
    });

    this.frameBindGroup = {
      bindGroup: frameBindGroup,
      buffer: [
          projectionTransformBuffer,
          viewTransformBuffer,
          cameraPosBuffer,
          aspectRatioBuffer,
          lightsBuffer,
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

          this.camera.updatePosition(elapsedTime, timestamp);
        }

        this.drawScene(timestamp);

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

  updateTransforms() {
    this.scene.updateTransforms(undefined, this);

    for (const node of this.scene.nodes) {
      if (isLight(node)) {
        this.lights.push(node);
      }
    };
  }

  drawScene(timestamp: number) {
    if (!this.context) {
      throw new Error('context is null');
    }

    if (!this.frameBindGroup) {
      throw new Error('uniformBuffer is not set');
    }

    // this.cursor.translate[0] = this.camera.position[0];
    // this.cursor.translate[2] = this.camera.position[2];

    this.updateTransforms();

    if (this.context.canvas.width !== this.renderedDimensions[0]
      || this.context.canvas.height !== this.renderedDimensions[1]
    ) {
      const depthTexture = gpu.device.createTexture({
        size: { width: this.context.canvas.width, height: this.context.canvas.height },
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.depthTextureView = depthTexture.createView();

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

    const view = this.context.getCurrentTexture().createView();

    if (this.camera.projection === 'Perspective') {
      gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[0], 0, this.camera.perspectiveTransform as Float32Array);
    } else {
      gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[0], 0, this.camera.orthographicTransform as Float32Array);
    }

    const inverseViewtransform = mat4.inverse(this.camera.viewTransform);
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[1], 0, inverseViewtransform as Float32Array);

    // Write the camera position

    const cameraPosition = vec4.transformMat4(vec4.create(0, 0, 0, 1), this.camera.viewTransform);
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[2], 0, cameraPosition as Float32Array);
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[3], 0, this.aspectRatio as Float32Array);

    // Update the light information
    lightsStructure.set({
      directional: vec4.transformMat4(
        vec4.create(1, 1, 1, 0),
        inverseViewtransform,
      ),
      directionalColor: vec4.create(1, 1, 1, 1),
      count: this.lights.length,
      lights: this.lights.map((light) => ({
        position: vec4.transformMat4(
          vec4.create(light.translate[0], light.translate[1], light.translate[2], 1),
          inverseViewtransform,
        ),
        color: light.lightColor,
      })),
    });

    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[4], 0, lightsStructure.arrayBuffer);

    const timeBuffer = new Float32Array(1);
    timeBuffer[0] = timestamp / 1000.0;
    
    gpu.device.queue.writeBuffer(this.frameBindGroup.buffer[5], 0, timeBuffer);

    const commandEncoder = gpu.device.createCommandEncoder();

    this.mainRenderPass.render(view, this.depthTextureView!, commandEncoder, this.frameBindGroup.bindGroup);

    this.transparentPass.render(view, this.depthTextureView!, commandEncoder, this.frameBindGroup.bindGroup);
    
    // if (this.selected.selection.length > 0) {
    //   // Transform camera position to world space.
    //   const origin = vec4.transformMat4(vec4.create(0, 0, 0, 1), this.camera.viewTransform);
    //   const centroid = this.selected.getCentroid();

    //   // We want to make the drag handles appear to be the same distance away
    //   // from the camera no matter how far the centroid is from the camera.
    //   const apparentDistance = 25;
    //   let actualDistance = vec3.distance(origin, centroid);
    //   const scale = actualDistance / apparentDistance;

    //   const mat = mat4.translate(mat4.identity(), centroid);
    //   mat4.scale(mat, vec3.create(scale, scale, scale), mat)

    //   if (this.transformer.spaceOrientation === 'Local') {
    //     mat4.multiply(mat, this.selected.selection[0].node.getRotation(), mat);
    //   }

    //   this.transformer.updateTransforms(mat)

    //   this.dragHandlesPass.pipelines = [];

    //   this.dragHandlesPass.render(view, this.depthTextureView!, commandEncoder);
    // }

    gpu.device.queue.submit([commandEncoder.finish()]);
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
}

export default Renderer;
