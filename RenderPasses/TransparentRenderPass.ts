import RenderPass from "./RenderPass";
import { RenderPassInterface } from "../types";
import { bloom } from "../RenderSetings";

class TransparentRenderPass extends RenderPass implements RenderPassInterface {
  getDescriptor(view: GPUTextureView, bright: GPUTextureView, depthView: GPUTextureView | null): GPURenderPassDescriptor {
    const colorAttachments: GPURenderPassColorAttachment[] = [
      {
        view,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "load" as GPULoadOp,
        storeOp: "store" as GPUStoreOp,
      },
    ]

    if (bloom) {
      colorAttachments.push({
        view: bright,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "load" as GPULoadOp,
        storeOp: "store" as GPUStoreOp,
      })
    }

    const descriptor: GPURenderPassDescriptor = {
      label: 'transparent render pass',
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
}

export default TransparentRenderPass;
