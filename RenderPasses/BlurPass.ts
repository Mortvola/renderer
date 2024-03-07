import { gpu } from "../Gpu";
import { outputFormat } from "../RenderSetings";
import { blurShader } from "../shaders/blur";

const label = 'blur pass';

class BlurPass {
  horizontalPipeline: GPURenderPipeline

  verticalPipeline: GPURenderPipeline

  pingpongBindGroup: GPUBindGroup
  
  scratchTextureView: GPUTextureView

  constructor(scratchTextureView: GPUTextureView) {
    this.scratchTextureView = scratchTextureView

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

    this.pingpongBindGroup = gpu.device.createBindGroup({
      label,
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1, resource: this.scratchTextureView,
        }
      ],
    });

    const shaderModule = gpu.device.createShaderModule({
      label,
      code: blurShader,
    })

    this.horizontalPipeline = this.createPipeline(shaderModule, bindGroupLayout, true);
    this.verticalPipeline = this.createPipeline(shaderModule, bindGroupLayout, false);
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
        entryPoint: horizontal ? "horizontalPass" : "verticalPass",
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
        ]
      }),
    };

    return gpu.device.createRenderPipeline(pipelineDescriptor);
  }

  render(destinationView: GPUTextureView, destinationBindGroup: GPUBindGroup, commandEncoder: GPUCommandEncoder) {
    let passEncoder = commandEncoder.beginRenderPass({
      label: 'blur horizontal pass',
      colorAttachments: [
        {
          view: this.scratchTextureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
    });

    passEncoder.setPipeline(this.horizontalPipeline);
    passEncoder.setBindGroup(0, destinationBindGroup);
    passEncoder.draw(3, 1);

    passEncoder.end();

    passEncoder = commandEncoder.beginRenderPass({
      label: 'blue vertical pass',
      colorAttachments: [
        {
          view: destinationView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
    });

    passEncoder.setPipeline(this.verticalPipeline);
    passEncoder.setBindGroup(0, this.pingpongBindGroup);
    passEncoder.draw(3, 1);

    passEncoder.end();
  }
}

export default BlurPass;
