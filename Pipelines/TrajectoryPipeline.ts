import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { bloom, outputFormat } from '../RenderSetings';
import { trajectoryShader } from '../shaders/trajectory';
import Pipeline from "./Pipeline";

const label = 'trajectory'
class TrajectoryPipeline extends Pipeline {
  constructor() {
    const shaderModule = gpu.device.createShaderModule({
      label,
      code: trajectoryShader,
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
        topology: "line-list",
        cullMode: "none",
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
          bindGroups.getBindGroupLayout3(),
        ],
      }),
    };
    
    super(gpu.device.createRenderPipeline(pipelineDescriptor), null, null);
  }
}

export default TrajectoryPipeline;
