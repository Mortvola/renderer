import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { bloom, outputFormat } from '../RenderSetings';
import { lineShader } from '../shaders/line';
import Pipeline from "./Pipeline";

class LinePipeline extends Pipeline {
  constructor() {
    const shaderModule = gpu.device.createShaderModule({
      label: 'line',
      code: lineShader,
    })

    const vertexBufferLayout: GPUVertexBufferLayout[] = [
      {
        attributes: [
          {
            shaderLocation: 0, // position
            offset: 0,
            format: "float32x4" as GPUVertexFormat,
          },
          {
            shaderLocation: 1, // color
            offset: 16,
            format: "float32x4" as GPUVertexFormat,
          },
        ],
        arrayStride: 32,
        stepMode: "vertex",
      },
    ];    
    
    const targets: GPUColorTargetState[] = [{
      format: outputFormat,
    }]

    if (bloom) {
      targets.push({
        format: outputFormat,
      })
    }

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: 'line',
      vertex: {
        module: shaderModule,
        entryPoint: "vertex_line",
        buffers: vertexBufferLayout,
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragment_line",
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
        label: 'line',
        bindGroupLayouts: [
          bindGroups.getBindGroupLayout0(),
        ],
      }),
    };
    
    super(gpu.device.createRenderPipeline(pipelineDescriptor), null, null);
  }
}

export default LinePipeline;
