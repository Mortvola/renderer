import SceneNode2d from "../Drawables/SceneNodes/SceneNode2d";
import { gpu } from "../Gpu";
import { bloom } from "../RenderSetings";
import { MaterialInterface, PipelineInterface, RenderPassInterface, maxInstances } from "../types";

type PipelineEntry = {
  pipeline: PipelineInterface,
  materials: Map<MaterialInterface, { index: number, count: number }>,
}

class RenderPass2D implements RenderPassInterface {
  pipelines: PipelineEntry[] = [];

  numInstances = 0;

  instanceDimensions: Float32Array = new Float32Array(4 * maxInstances);

  dimensionsBuffer: GPUBuffer

  instanceColorBuffer: GPUBuffer

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

    this.instanceColorBuffer = gpu.device.createBuffer({
      label: 'instance color',
      size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = gpu.device.createBindGroup({
      label: 'bind group for dimensions',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.dimensionsBuffer }},
        { binding: 1, resource: { buffer: this.instanceColorBuffer }},
      ],
    });
  }

  addDrawable(sceneNode2d: SceneNode2d) {
    if (sceneNode2d.material) {
      const pipeline = sceneNode2d.material.pipeline;

      if (pipeline) {
        let pipelineEntry = this.pipelines.find((p) => p.pipeline === pipeline) ?? null;

        if (!pipelineEntry) {
          pipelineEntry = { pipeline, materials: new Map() }

          this.pipelines.push(pipelineEntry);
        }
    
        if (pipelineEntry) {
          let materialDrawables = pipelineEntry.materials.get(sceneNode2d.material);

          if (!materialDrawables) {
            materialDrawables = { index: this.numInstances, count: 0 }
            pipelineEntry.materials.set(sceneNode2d.material, materialDrawables)            
          }

          this.instanceDimensions[this.numInstances * 4 + 0] = sceneNode2d.x;
          this.instanceDimensions[this.numInstances * 4 + 1] = sceneNode2d.y;
          this.instanceDimensions[this.numInstances * 4 + 2] = sceneNode2d.width;
          this.instanceDimensions[this.numInstances * 4 + 3] = sceneNode2d.height;

          materialDrawables.count += 1
          this.numInstances += 1
        }  
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
  ) {
    const passEncoder = commandEncoder.beginRenderPass(this.getDescriptor(view, bright, depthView));

    passEncoder.setBindGroup(0, frameBindGroup);

    gpu.device.queue.writeBuffer(this.dimensionsBuffer, 0, this.instanceDimensions, 0, this.numInstances * 4);  

    passEncoder.setBindGroup(1, this.bindGroup);

    for (const pipelineEntry of this.pipelines) {
      passEncoder.setPipeline(pipelineEntry.pipeline.pipeline);
  
      for (const [material, instances] of pipelineEntry.materials) {
        material.setBindGroups(passEncoder)
        passEncoder.draw(6, instances.count, undefined, instances.index);  
      }
    }

    this.numInstances = 0;

    this.pipelines = [];

    passEncoder.end();
  }
}

export default RenderPass2D;
