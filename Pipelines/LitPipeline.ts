import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { litShader } from '../shaders/lit';
import Pipeline from "./Pipeline";

class LitPipeline extends Pipeline {
  constructor() {
    super();

    const shaderModule = gpu.device.createShaderModule({
      label: 'lit',
      code: litShader,
    })
    
    const vertexBufferLayout: GPUVertexBufferLayout[] = [
      {
        attributes: [
          {
            shaderLocation: 0, // position
            offset: 0,
            format: "float32x4",
          },
        ],
        arrayStride: 16,
        stepMode: "vertex",
      },
      {
        attributes: [
          {
            shaderLocation: 1, // normal
            offset: 0,
            format: "float32x4",
          }
        ],
        arrayStride: 16,
        stepMode: "vertex",
      }
    ];
    
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      vertex: {
        module: shaderModule,
        entryPoint: "vs",
        buffers: vertexBufferLayout,
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
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
        bindGroupLayouts: [
          bindGroups.getBindGroupLayout0(),
          bindGroups.getBindGroupLayout1(),
          bindGroups.getBindGroupLayout2A(),
        ],
      }),
    };
    
    this.pipeline = gpu.device.createRenderPipeline(pipelineDescriptor);
  }
}

export default LitPipeline;
