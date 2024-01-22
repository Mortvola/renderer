import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { texturedShader } from "../shaders/textured";
import Pipeline from "./Pipeline";

const label = 'reticle';

class ReticlePipeline extends Pipeline {
  constructor() {
    super();

    const shaderModule = gpu.device.createShaderModule({
      label,
      code: texturedShader,
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
      },
      {
        attributes: [
          {
            shaderLocation: 2, // texcoord
            offset: 0,
            format: "float32x2",
          }
        ],
        arrayStride: 8,
        stepMode: "vertex",
      },
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
        cullMode: 'none',
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
        ]
      }),
    };
    
    this.pipeline = gpu.device.createRenderPipeline(pipelineDescriptor);
  }
}

export default ReticlePipeline;
