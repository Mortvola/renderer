import SceneGraph2D from "../SceneGraph2d";
import { RenderPass2DInterface } from "../types";

class TransparentRenderPass2D implements RenderPass2DInterface {
  getDescriptor(
    view: GPUTextureView,
    depthView: GPUTextureView | null,
  ): GPURenderPassDescriptor {
    const colorAttachments: GPURenderPassColorAttachment[] = [{
      view,
      clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
      loadOp: "load",
      storeOp: "store",
    }]

    const descriptor: GPURenderPassDescriptor = {
      label: '2D transparent render pass',
      colorAttachments,
    };

    if (depthView) {
      descriptor.depthStencilAttachment = {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: "load" as GPULoadOp,
        depthStoreOp: "store" as GPUStoreOp,
      };
    }

    return descriptor;
  }

  render(
    view: GPUTextureView,
    depthView: GPUTextureView | null,
    commandEncoder: GPUCommandEncoder,
    frameBindGroup: GPUBindGroup,
    scene2d: SceneGraph2D,
  ) {
    if (scene2d.indexBuffer) {
      const passEncoder = commandEncoder.beginRenderPass(this.getDescriptor(view, depthView));

      passEncoder.setBindGroup(0, frameBindGroup);

      passEncoder.setVertexBuffer(0, scene2d.vertexBuffer);
      passEncoder.setVertexBuffer(1, scene2d.texcoordBuffer);
      passEncoder.setIndexBuffer(scene2d.indexBuffer, scene2d.indexFormat);

      passEncoder.setBindGroup(1, scene2d.bindGroup);

      for (const pipelineEntry of scene2d.transparentPipelines) {
        passEncoder.setPipeline(pipelineEntry.pipeline.pipeline);
    
        for (const [material, instances] of pipelineEntry.materials) {
          material.setBindGroups(passEncoder)

          for (const [, meshInfo] of instances) {
            passEncoder.drawIndexed(
              meshInfo.indexCount,
              meshInfo.instanceCount,
              meshInfo.firstIndex,
              meshInfo.baseVertex,
              meshInfo.firstInstance,
            );    
          }
        }
      }

      passEncoder.end();
    }
  }
}

export default TransparentRenderPass2D;
