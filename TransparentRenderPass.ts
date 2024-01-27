import RenderPass from "./RenderPass";
import { RenderPassInterface } from "./types";

class TransparentRenderPass extends RenderPass implements RenderPassInterface {
  getDescriptor(view: GPUTextureView, depthView: GPUTextureView | null): GPURenderPassDescriptor {
    const descriptor: GPURenderPassDescriptor = {
      label: 'main render pass',
      colorAttachments: [
        {
          view,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "load" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
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
}

export default TransparentRenderPass;
