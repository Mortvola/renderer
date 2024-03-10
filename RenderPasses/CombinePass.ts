import { bindGroups } from "../BindGroups";
import { gpu } from "../Gpu";
import { outputFormat } from "../RenderSetings";
import { deferredCombine } from "../shaders/deferredCombine";

class CombinePass {
  deferredCombinePipeline: GPURenderPipeline

  deferredCombineBindGroup: GPUBindGroup

  constructor(albedoView: GPUTextureView, positionView: GPUTextureView, normalView: GPUTextureView, decalView: GPUTextureView) {
    const bindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'Deferred Combine Pass',
      entries: [
        { // Sampler
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        { // Albedo Texture
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        { // Position Texture
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        { // Normal Texture
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
        { // Decal Texture
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
      ]
    });

    const sampler = gpu.device.createSampler();

    this.deferredCombineBindGroup = gpu.device.createBindGroup({
      label: 'Deferred Combine Pass',
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: albedoView,
        },
        {
          binding: 2,
          resource: positionView,
        },
        {
          binding: 3,
          resource: normalView,
        },
        {
          binding: 4,
          resource: decalView,
        },
      ],
    });

    this.deferredCombinePipeline = this.createPipeline(bindGroupLayout);
  }

  createPipeline(bindGroupLayout: GPUBindGroupLayout) {
    const shaderModule = gpu.device.createShaderModule({
      label: 'Deferred Combine Pass',
      code: deferredCombine,
    })

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: 'Deferred Combine Pass',
      vertex: {
        module: shaderModule,
        entryPoint: "vs",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs",
        targets: [
          {
            format: outputFormat,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
        frontFace: "ccw",
      },
      layout: gpu.device.createPipelineLayout({
        label: 'Deferred Combine',
        bindGroupLayouts: [
          bindGroups.getBindGroupLayout0(),
          bindGroupLayout,
        ]
      }),
    };

    return gpu.device.createRenderPipeline(pipelineDescriptor);
  }

  render(
    destination: GPUTextureView,
    commandEncoder: GPUCommandEncoder,
    frameBindGroup: GPUBindGroup,
  ) {
    let passEncoder = commandEncoder.beginRenderPass({
      label: 'deferred combine pass',
      colorAttachments: [
        {
          view: destination,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
    });

    passEncoder.setPipeline(this.deferredCombinePipeline);
    passEncoder.setBindGroup(0, frameBindGroup);
    passEncoder.setBindGroup(1, this.deferredCombineBindGroup);
    passEncoder.draw(3, 1);

    passEncoder.end();
  }
}

export default CombinePass;
