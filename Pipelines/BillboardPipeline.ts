import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { bloom, outputFormat } from '../RenderSetings';
import { billboardShader } from '../shaders/billboard';
import Pipeline from "./Pipeline";

const label = 'BillboardPipeline';

class BillboardPipeline extends Pipeline {
  constructor() {
    super();

    const shaderModule = gpu.device.createShaderModule({
      label,
      code: billboardShader,
    })
    
    const targets: GPUColorTargetState[] = [{
      format: outputFormat,
    }]

    if (bloom) {
      targets.push({
        format: outputFormat,
      })
    }

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label,
      vertex: {
        module: shaderModule,
        entryPoint: "vs",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs",
        targets,
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
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
        ]
      }),
    };
    
    this.pipeline = gpu.device.createRenderPipeline(pipelineDescriptor);
  }
}

export default BillboardPipeline;
