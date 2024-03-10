import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { outputFormat } from '../RenderSetings';
import Property from '../ShaderBuilder/Property';
import { decalShader } from '../shaders/decal';
import Pipeline from "./Pipeline";

const label = 'decal';

class DecalPipeline extends Pipeline {
  constructor() {
    const shaderModule = gpu.device.createShaderModule({
      label,
      code: decalShader,
    })
    
    const vertexBufferLayout: GPUVertexBufferLayout[] = [
      {
        attributes: [
          {
            shaderLocation: 0, // position
            offset: 0,
            format: "float32x4" as GPUVertexFormat,
          },
        ],
        arrayStride: 16,
        stepMode: "vertex",
      },
    ];    

    const textureGroupLayout = gpu.device.createBindGroupLayout({
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
            format: outputFormat,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
        frontFace: "ccw",
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: "depth24plus"
      },
      layout: gpu.device.createPipelineLayout({
        label,
        bindGroupLayouts: [
          bindGroups.getBindGroupLayout0(),
          bindGroups.getBindGroupLayout1(),
          textureGroupLayout,
          textureGroupLayout,
        ]
      }),
    };
    
    super(gpu.device.createRenderPipeline(pipelineDescriptor), null,  null);

    this.fragmentStageBindings = {
      binding: 2,
      layout: textureGroupLayout,
      properties: [
        new Property('sampler', 'sampler', {}, false),
        new Property('albedo', 'texture2D', 0, false),
      ],
      structuredView: null,    
    }
  }
}

export default DecalPipeline;
