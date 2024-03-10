import DrawableInterface from "../Drawables/DrawableInterface";
import { gpu } from "../Gpu";
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

  runPipelines(passEncoder: GPURenderPassEncoder) {
    for (const pipelineEntry of this.pipelines) {
      passEncoder.setPipeline(pipelineEntry.pipeline.pipeline);
  
      for (const [material, drawables] of pipelineEntry.materials) {
        material.setBindGroups(passEncoder)
  
        for (const drawable of drawables) {
          if (drawable.numInstances > 0) {
            gpu.device.queue.writeBuffer(drawable.modelMatrixBuffer, 0, drawable.modelMatrices, 0, drawable.numInstances * 16);  
            gpu.device.queue.writeBuffer(drawable.inverseModelMatrixBuffer, 0, drawable.inverseModelMatrices, 0, drawable.numInstances * 16);  
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
