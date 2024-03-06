import DrawableInterface from "../Drawables/DrawableInterface";
import { gpu } from "../Gpu";
import { DrawableNodeInterface, MaterialInterface, PipelineInterface, RenderPassInterface } from "../types";

type PipelineEntry = {
  pipeline: PipelineInterface,
  materials: Map<MaterialInterface, DrawableInterface[]>,
}

class RenderPass implements RenderPassInterface {
  pipelines: PipelineInterface[] = [];

  addDrawable(drawable: DrawableNodeInterface) {
    const pipeline = drawable.material.pipeline;

    if (pipeline) {
      let pipelineEntry = this.pipelines.find((p) => p === pipeline) ?? null;

      if (!pipelineEntry) {
        this.pipelines.push(pipeline);
  
        pipelineEntry = pipeline; // this.pipelines[this.pipelines.length - 1];
      }
  
      if (pipelineEntry) {
        pipelineEntry.addDrawable(drawable)
      }  
    }
  }

  runPipelines(passEncoder: GPURenderPassEncoder) {
    for (const pipelineEntry of this.pipelines) {
      passEncoder.setPipeline(pipelineEntry.pipeline.pipeline);
  
      for (const [material, drawables] of pipelineEntry.materials) {
        material.setBindGroups(passEncoder)
  
        for (const drawable of drawables) {
          if (drawable.numInstances > 0) {
            gpu.device.queue.writeBuffer(drawable.modelMatrixBuffer, 0, drawable.modelMatrices, 0, drawable.numInstances * 16);  
            gpu.device.queue.writeBuffer(drawable.instanceColorBuffer, 0, drawable.instanceColor, 0, drawable.numInstances * 4);  
            passEncoder.setBindGroup(1, drawable.bindGroup);
  
            drawable.render(passEncoder);
    
            drawable.numInstances = 0;
          }
        }
      }
    }

    this.pipelines = [];
  }
}

export default RenderPass;
