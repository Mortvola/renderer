import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { outlineShader } from '../shaders/outline';
import Pipeline from "./Pipeline";

const label = 'outline';

class OutlinePipeline extends Pipeline {
  constructor() {
    super();

    const shaderModule = gpu.device.createShaderModule({
      label,
      code: outlineShader,
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
      label,
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
        cullMode: "front",
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
          bindGroups.getBindGroupLayout2(),
          bindGroups.getBindGroupLayout3(),
        ],
      }),
    };
    
    this.pipeline = gpu.device.createRenderPipeline(pipelineDescriptor);
  }
}

export default OutlinePipeline;
