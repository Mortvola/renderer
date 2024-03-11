import { bloom } from "../RenderSetings";
import RenderPass from "./RenderPass";

class ForwardRenderPass extends RenderPass {
  label: string

  constructor(label: string) {
    super()
    this.label = label;
  }

  getDescriptor(
    view: GPUTextureView,
    bloom: GPUTextureView,
    loadBloom: boolean,
    depthView: GPUTextureView | null,
  ): GPURenderPassDescriptor {
    const colorAttachments: GPURenderPassColorAttachment[] = [
      {
        view,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "load",
        storeOp: "store",
      },
    ]

    if (bloom) {
      colorAttachments.push({
        view: bloom,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: loadBloom ? "load" : "clear",
        storeOp: "store",
      })
    }

    const descriptor: GPURenderPassDescriptor = {
      label: this.label,
      colorAttachments,
    };

    if (depthView) {
      descriptor.depthStencilAttachment = {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: "load",
        depthStoreOp: "store",
      };
    }

    return descriptor;
  }

  render(
    view: GPUTextureView,
    bloom: GPUTextureView,
    loadBloom: boolean,
    depthView: GPUTextureView | null,
    commandEncoder: GPUCommandEncoder,
    frameBindGroup: GPUBindGroup,
  ) {
    const passEncoder = commandEncoder.beginRenderPass(this.getDescriptor(view, bloom, loadBloom, depthView!));

    passEncoder.setBindGroup(0, frameBindGroup);

    this.runPipelines(passEncoder)

    passEncoder.end();
  }
}

export default ForwardRenderPass;
