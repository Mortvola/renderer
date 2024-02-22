import { gpu } from "../Gpu";
import { outputFormat } from "../RenderSetings";
import { bloomShader } from "../shaders/bloom";
import BlurPass from "./BlurPass";

const label = 'post process';

class BloomPass {
  pipeline: GPURenderPipeline

  screenBindGroup: GPUBindGroup

  bloomBindGroup: GPUBindGroup

  screenTextureView: GPUTextureView

  bloomTextureView: GPUTextureView

  blurPass: BlurPass

  constructor(context: GPUCanvasContext) {
    this.blurPass = new BlurPass(context)

    this.screenTextureView = this.createTexture(context).createView()
    this.bloomTextureView = this.createTexture(context).createView()

    const bindGroupLayout = gpu.device.createBindGroupLayout({
      label,
      entries: [
        { // Sampler
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        { // Texture 2D
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
      ]
    });

    const sampler = gpu.device.createSampler();

    this.screenBindGroup = gpu.device.createBindGroup({
      label,
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1, resource: this.screenTextureView,
        },
      ],
    });

    this.bloomBindGroup = gpu.device.createBindGroup({
      label,
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1, resource: this.bloomTextureView,
        },
      ],
    });

    const shaderModule = gpu.device.createShaderModule({
      label,
      code: bloomShader,
    })

    this.pipeline = this.createPipeline(shaderModule, bindGroupLayout, true);
  }

  createTexture(context: GPUCanvasContext) {
    return gpu.device.createTexture({
      format: outputFormat,
      size: { width: context.canvas.width, height: context.canvas.height },
      usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  createPipeline(shaderModule: GPUShaderModule, bindGroupLayout: GPUBindGroupLayout, horizontal: boolean) {
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label,
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
        label,
        bindGroupLayouts: [
          bindGroupLayout,
          bindGroupLayout,
        ]
      }),
    };

    return gpu.device.createRenderPipeline(pipelineDescriptor);
  }

  render(view: GPUTextureView, commandEncoder: GPUCommandEncoder) {
    this.blurPass.render(this.bloomTextureView, this.bloomBindGroup, commandEncoder)
    this.blurPass.render(this.bloomTextureView, this.bloomBindGroup, commandEncoder)
    this.blurPass.render(this.bloomTextureView, this.bloomBindGroup, commandEncoder)
    this.blurPass.render(this.bloomTextureView, this.bloomBindGroup, commandEncoder)
    this.blurPass.render(this.bloomTextureView, this.bloomBindGroup, commandEncoder)

    let passEncoder = commandEncoder.beginRenderPass({
      label: 'bloom render pass',
      colorAttachments: [
        {
          view,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
    });

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.screenBindGroup);
    passEncoder.setBindGroup(1, this.bloomBindGroup);
    passEncoder.draw(3, 1);

    passEncoder.end();
  }
}

export default BloomPass;
