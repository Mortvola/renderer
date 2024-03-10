import RenderPass from "./RenderPass";

class DeferredRenderPass extends RenderPass {
  getDescriptor(
    albedoView: GPUTextureView,  
    positionView: GPUTextureView,
    normalView: GPUTextureView,
    depthView: GPUTextureView,
  ): GPURenderPassDescriptor {
    const colorAttachments: GPURenderPassColorAttachment[] = [
      {
        view: albedoView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "clear" as GPULoadOp,
        storeOp: "store" as GPUStoreOp,
      },
      {
        view: positionView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "clear" as GPULoadOp,
        storeOp: "store" as GPUStoreOp,
      },
      {
        view: normalView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "clear" as GPULoadOp,
        storeOp: "store" as GPUStoreOp,
      }
    ]

    const descriptor: GPURenderPassDescriptor = {
      label: 'deferred render pass',
      colorAttachments,
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: "clear" as GPULoadOp,
        depthStoreOp: "store" as GPUStoreOp,
      }
    };

    return descriptor;
  }

  render(
    albedoView: GPUTextureView,  
    positionView: GPUTextureView,
    normalView: GPUTextureView,
    depthView: GPUTextureView | null,
    commandEncoder: GPUCommandEncoder,
    frameBindGroup: GPUBindGroup,
  ) {
    const passEncoder = commandEncoder.beginRenderPass(
      this.getDescriptor(
        albedoView,
        positionView,
        normalView,
        depthView!,
      ),
    );

    passEncoder.setBindGroup(0, frameBindGroup);

    this.runPipelines(passEncoder)

    passEncoder.end();
  }
}

export default DeferredRenderPass;
