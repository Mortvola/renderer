import { gpu } from "../Gpu";
import RenderPass from "./RenderPass";

class DecalPass extends RenderPass {
  // decalPipeline: GPURenderPipeline

  decalBindGroup: GPUBindGroup

  constructor(positionView: GPUTextureView) {
    super();

    const bindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'Decal Pass',
      entries: [
        { // Sampler
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        { // Position Texture
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
      ]
    });

    const sampler = gpu.device.createSampler();

    this.decalBindGroup = gpu.device.createBindGroup({
      label: 'Decal Pass',
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: positionView,
        },
      ],
    });
  }

  render(
    destination: GPUTextureView,
    depthView: GPUTextureView,
    commandEncoder: GPUCommandEncoder,
    frameBindGroup: GPUBindGroup,
  ) {
    let passEncoder = commandEncoder.beginRenderPass({
      label: 'Decal Pass',
      colorAttachments: [
        {
          view: destination,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: "load" as GPULoadOp,
        depthStoreOp: "store" as GPUStoreOp,
      }
    });

    passEncoder.setBindGroup(0, frameBindGroup);

    passEncoder.setBindGroup(2, this.decalBindGroup);
    passEncoder.setBindGroup(3, this.decalBindGroup);

    this.runPipelines(passEncoder)

    passEncoder.end();
  }
}

export default DecalPass;
