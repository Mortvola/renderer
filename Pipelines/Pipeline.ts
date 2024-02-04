import { gpu } from "../Gpu";
import { DrawableNodeInterface, MaterialInterface, PipelineInterface } from "../types";

class Pipeline implements PipelineInterface {
  pipeline: GPURenderPipeline | null = null;

  // drawables: DrawableInterface[] = [];
  materials: MaterialInterface[] = [];

  addDrawable(drawable: DrawableNodeInterface): void {
    let entry = this.materials.find((d) => d === drawable.material);

    if (!entry) {
      this.materials.push(drawable.material);
    }

    drawable.material.addDrawable(drawable);
  }

  removeDrawable(drawable: DrawableNodeInterface): void {
    throw new Error("Method not implemented.");
  }

  render(passEncoder: GPURenderPassEncoder) {
    if (this.pipeline) {
      passEncoder.setPipeline(this.pipeline);

      for (const material of this.materials) {
        passEncoder.setBindGroup(2, material.bindGroup);

        for (const drawable of material.drawables) {
          gpu.device.queue.writeBuffer(drawable.modelMatrixBuffer, 0, drawable.modelMatrices);  
          gpu.device.queue.writeBuffer(drawable.instanceColorBuffer, 0, drawable.instanceColor);  
          passEncoder.setBindGroup(1, drawable.bindGroup);

          drawable.render(passEncoder, drawable.numInstances);
  
          drawable.numInstances = 0;
        }

        material.drawables = [];
      }
    }

    this.materials = [];
  }
}

export default Pipeline;
