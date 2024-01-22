import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { reticleShader } from '../shaders/reticle';
import Pipeline from "./Pipeline";

const label = 'reticle';

class ReticlePipeline extends Pipeline {
  constructor() {
    super();

    const shaderModule = gpu.device.createShaderModule({
      label,
      code: reticleShader,
    })
    
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
            format: navigator.gpu.getPreferredCanvasFormat(),
            blend: {
              color: {
                srcFactor: 'src-alpha' as GPUBlendFactor,
                dstFactor: 'one-minus-src-alpha' as GPUBlendFactor,
              },
              alpha: {
                srcFactor: 'src-alpha' as GPUBlendFactor,
                dstFactor: 'one-minus-src-alpha' as GPUBlendFactor,
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
        frontFace: "ccw",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      },
      layout: gpu.device.createPipelineLayout({
        label,
        bindGroupLayouts: [
          bindGroups.getBindGroupLayout0(),
          bindGroups.getBindGroupLayout1(),
          bindGroups.getBindGroupLayout2(),
          bindGroups.getBindGroupLayout3(),
        ]
      }),
    };
    
    this.pipeline = gpu.device.createRenderPipeline(pipelineDescriptor);
  }
}

export default ReticlePipeline;
