import DrawableInterface from "../Drawables/DrawableInterface";
import { gpu } from "../Gpu";
import { bloom } from "../RenderSetings";
import { DrawableNodeInterface, MaterialInterface, PipelineInterface, RenderPassInterface } from "../types";

type PipelineEntry = {
  pipeline: PipelineInterface,
  materials: Map<MaterialInterface, DrawableInterface[]>,
}

class RenderPass implements RenderPassInterface {
  pipelines: PipelineEntry[] = [];

  addDrawable(drawableNode: DrawableNodeInterface) {
    const pipeline = drawableNode.material.pipeline;

    if (pipeline) {
      let pipelineEntry = this.pipelines.find((p) => p.pipeline === pipeline) ?? null;

      if (!pipelineEntry) {
        pipelineEntry = { pipeline, materials: new Map() }

        this.pipelines.push(pipelineEntry);
      }
  
      if (pipelineEntry) {
        let materialDrawables = pipelineEntry.materials.get(drawableNode.material);

        if (materialDrawables) {
          materialDrawables.push(drawableNode.drawable)
        }
        else {
          pipelineEntry.materials.set(drawableNode.material, [drawableNode.drawable])
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
      loadOp: "clear" as GPULoadOp,
      storeOp: "store" as GPUStoreOp,
    }]

    if (bloom) {
      colorAttachments.push({
        view: bright,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "clear" as GPULoadOp,
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

    for (const pipelineEntry of this.pipelines) {
      passEncoder.setPipeline(pipelineEntry.pipeline.pipeline);
  
      for (const [material, drawables] of pipelineEntry.materials) {
        material.setBindGroups(passEncoder)
  
        for (const drawable of drawables) {
          if (drawable.numInstances > 0) {
            gpu.device.queue.writeBuffer(drawable.modelMatrixBuffer, 0, drawable.modelMatrices, 0, drawable.numInstances * 16);  
            gpu.device.queue.writeBuffer(drawable.instanceColorBuffer, 0, drawable.instanceColor, 0, drawable.numInstances * 4);  
            passEncoder.setBindGroup(1, drawable.bindGroup);
  
            drawable.render(passEncoder, drawable.numInstances);
    
            drawable.numInstances = 0;
          }
        }
      }
    }

    this.pipelines = [];

    passEncoder.end();
  }
}

export default RenderPass;
