import SceneNode2d from "../Drawables/SceneNodes/SceneNode2d";
import { gpu } from "../Gpu";
import Material from "../Materials/Material";
import { bloom } from "../RenderSetings";
import SceneGraph2D from "../SceneGraph2d";
import { MaterialInterface, PipelineInterface, RenderPass2DInterface, maxInstances } from "../types";

type PipelineEntry = {
  pipeline: PipelineInterface,
  materials: Map<MaterialInterface, { index: number, count: number }>,
}

const defaultMaterial = await Material.create('2D', [])

class RenderPass2D implements RenderPass2DInterface {
  pipelines: PipelineEntry[] = [];

  numInstances = 0;

  instanceDimensions: Float32Array = new Float32Array(4 * maxInstances);

  instanceColor: Float32Array = new Float32Array(4 * maxInstances);

  dimensionsBuffer: GPUBuffer

  colorsBuffer: GPUBuffer

  bindGroup: GPUBindGroup

  constructor() {
    const bindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'dimension layout',
      entries: [
        { // dimensions
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Instance color
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
      ]
    });

    this.dimensionsBuffer = gpu.device.createBuffer({
      label: 'model Matrix',
      size: 16 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.colorsBuffer = gpu.device.createBuffer({
      label: 'instance color',
      size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = gpu.device.createBindGroup({
      label: 'bind group for dimensions',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.dimensionsBuffer }},
        { binding: 1, resource: { buffer: this.colorsBuffer }},
      ],
    });
  }

  addDrawable(
    sceneNode2d: SceneNode2d,
    canvasWidth: number,
    canvasHeight: number,
    d: { x: number, y: number, width: number, height: number },
  ) {
    if (sceneNode2d.material || sceneNode2d.color) {
      let material: MaterialInterface = defaultMaterial

      if (sceneNode2d.material) {
        material = sceneNode2d.material
      }

      const aspectRatio = (canvasWidth / canvasHeight)

      let dimensions = { x: d.x / canvasWidth * 4, y: d.y / canvasHeight * 4 / aspectRatio, width: d.width / canvasWidth * 4, height: d.height / canvasHeight * 4 / aspectRatio }

      if (sceneNode2d.border) {
        dimensions.x += sceneNode2d.border.width / canvasWidth * 2
        dimensions.y -= sceneNode2d.border.width / canvasHeight * 2
        dimensions.width -= (sceneNode2d.border.width / canvasWidth) * 2 * 2
        dimensions.height -= (sceneNode2d.border.width / canvasHeight) * 2 * 2 / (canvasWidth / canvasHeight)
      }

      this.addElement(material, dimensions, sceneNode2d.color)

      if (sceneNode2d.border) {
        let dimensions = { x: d.x / canvasWidth * 4, y: d.y / canvasHeight * 4 / aspectRatio, width: d.width / canvasWidth * 4, height: d.height / canvasHeight * 4 / aspectRatio }

        this.addElement(defaultMaterial, dimensions, sceneNode2d.border.color)
      }

      this.addElement(material, dimensions, sceneNode2d.color)
    }
  }

  addElement(
    material: MaterialInterface,
    dimensions: { x: number, y: number, width: number, height: number},
    color?: number[],
  ) {
    if (material.pipeline) {
      let pipelineEntry = this.pipelines.find((p) => p.pipeline === material.pipeline) ?? null;

      if (!pipelineEntry) {
        pipelineEntry = { pipeline: material.pipeline, materials: new Map() }

        this.pipelines.push(pipelineEntry);
      }
  
      if (pipelineEntry) {
        let materialDrawables = pipelineEntry.materials.get(material);

        if (!materialDrawables) {
          materialDrawables = { index: this.numInstances, count: 0 }
          pipelineEntry.materials.set(material, materialDrawables)            
        }

        this.instanceDimensions[this.numInstances * 4 + 0] = dimensions.x;
        this.instanceDimensions[this.numInstances * 4 + 1] = dimensions.y;
        this.instanceDimensions[this.numInstances * 4 + 2] = dimensions.width;
        this.instanceDimensions[this.numInstances * 4 + 3] = dimensions.height;

        if (color) {
          this.instanceColor[this.numInstances * 4 + 0] = color[0];
          this.instanceColor[this.numInstances * 4 + 1] = color[1];
          this.instanceColor[this.numInstances * 4 + 2] = color[2];
          this.instanceColor[this.numInstances * 4 + 3] = color[3];  
        }

        materialDrawables.count += 1
        this.numInstances += 1
      }  
    }
  }

  getDescriptor(
    view: GPUTextureView,
    bright: GPUTextureView,
    depthView: GPUTextureView | null,
  ): GPURenderPassDescriptor {
    const colorAttachments: GPURenderPassColorAttachment[] = [{
      view,
      clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
      loadOp: "load" as GPULoadOp,
      storeOp: "store" as GPUStoreOp,
    }]

    if (bloom) {
      colorAttachments.push({
        view: bright,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "load" as GPULoadOp,
        storeOp: "store" as GPUStoreOp,
      })
    }

    const descriptor: GPURenderPassDescriptor = {
      label: 'main render pass',
      colorAttachments,
    };

    if (depthView) {
      descriptor.depthStencilAttachment = {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: "clear" as GPULoadOp,
        depthStoreOp: "store" as GPUStoreOp,
      };
    }

    return descriptor;
  }

  render(
    view: GPUTextureView,
    bright: GPUTextureView,
    depthView: GPUTextureView | null,
    commandEncoder: GPUCommandEncoder,
    frameBindGroup: GPUBindGroup,
    scene2d: SceneGraph2D,
  ) {
    if (scene2d.indexBuffer) {
      const passEncoder = commandEncoder.beginRenderPass(this.getDescriptor(view, bright, depthView));

      passEncoder.setBindGroup(0, frameBindGroup);

      passEncoder.setVertexBuffer(0, scene2d.vertexBuffer);
      passEncoder.setVertexBuffer(1, scene2d.texcoordBuffer);
      passEncoder.setIndexBuffer(scene2d.indexBuffer, scene2d.indexFormat);

      passEncoder.setBindGroup(1, scene2d.bindGroup);

      for (const pipelineEntry of scene2d.pipelines) {
        passEncoder.setPipeline(pipelineEntry.pipeline.pipeline);
    
        for (const [material, instances] of pipelineEntry.materials) {
          material.setBindGroups(passEncoder)

          for (const [mesh, meshInfo] of instances) {
            passEncoder.drawIndexed(
              mesh.indices.length,
              meshInfo.instanceCount,
              meshInfo.firstIndex,
              meshInfo.baseVertex,
              meshInfo.firstInstance,
            );    
          }
        }
      }

      this.numInstances = 0;

      this.pipelines = [];

      passEncoder.end();
    }
  }
}

export default RenderPass2D;
