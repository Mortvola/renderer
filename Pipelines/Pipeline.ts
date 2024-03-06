import { gpu } from "../Gpu";
import { DrawableNodeInterface, MaterialInterface, PipelineInterface, StageBindings } from "../types";

class Pipeline implements PipelineInterface {
  pipeline: GPURenderPipeline;

  vertexStageBindings: StageBindings | null

  fragmentStageBindings: StageBindings | null

  // drawables: DrawableInterface[] = [];
  materials: MaterialInterface[] = [];

  constructor(
    pipeline: GPURenderPipeline,
    vertexStageBindings: StageBindings | null,
    fragmentStageBindings: StageBindings | null,
  ) {
    this.pipeline = pipeline;
    this.vertexStageBindings = vertexStageBindings
    this.fragmentStageBindings = fragmentStageBindings
  }

  addDrawable(drawable: DrawableNodeInterface): void {
    let entry = this.materials.find((m) => m === drawable.material);

    if (!entry) {
      this.materials.push(drawable.material);
    }

    drawable.material.addDrawable(drawable);
  }

  removeDrawable(drawable: DrawableNodeInterface): void {
    throw new Error("Method not implemented.");
  }

  render(passEncoder: GPURenderPassEncoder) {
    passEncoder.setPipeline(this.pipeline);

    for (const material of this.materials) {
      material.setBindGroups(passEncoder)

      for (const drawable of material.drawables) {
        if (drawable.numInstances > 0) {
          gpu.device.queue.writeBuffer(drawable.modelMatrixBuffer, 0, drawable.modelMatrices, 0, drawable.numInstances * 16);  
          gpu.device.queue.writeBuffer(drawable.instanceColorBuffer, 0, drawable.instanceColor, 0, drawable.numInstances * 4);  
          passEncoder.setBindGroup(1, drawable.bindGroup);

          drawable.render(passEncoder, drawable.numInstances);
  
          drawable.numInstances = 0;
        }
      }

      material.drawables = [];
    }

    this.materials = [];
  }
}

export default Pipeline;
