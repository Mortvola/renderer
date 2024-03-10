import { bindGroups } from "../BindGroups";
import Mesh from "../Drawables/Mesh";
import { gpu } from "../Gpu";
import { outputFormat } from "../RenderSetings";
import { outlineShader } from "../shaders/outline";
import { outlineApplyShader } from "../shaders/outlineApply";
import { DrawableNodeInterface } from "../types";

const label = 'outline pass';

class OutlinePass {
  outlinePipeline: GPURenderPipeline

  applyOutlinePipeline: GPURenderPipeline

  applyOutlineBindGroup: GPUBindGroup
  
  scratchTextureView: GPUTextureView

  constructor(scratchTextureView: GPUTextureView) {
    this.scratchTextureView = scratchTextureView

    const outlineModule = gpu.device.createShaderModule({
      label: 'Outline Pass',
      code: outlineShader,
    })

    this.outlinePipeline = this.createOutlinePipeline(outlineModule);

    const bindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'apply outline pass',
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

    this.applyOutlineBindGroup = gpu.device.createBindGroup({
      label: 'apply outline pass',
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: sampler,
        },
        {
          binding: 1,
          resource: this.scratchTextureView,
        }
      ],
    });

    const outlineApplyModule = gpu.device.createShaderModule({
      label: 'Apply Outline Pass',
      code: outlineApplyShader,
    })

    this.applyOutlinePipeline = this.createApplyPipeline(outlineApplyModule, bindGroupLayout);
  }

  createOutlinePipeline(shaderModule: GPUShaderModule) {
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label,
      vertex: {
        module: shaderModule,
        entryPoint: "vs",
        buffers: [
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
        ],
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
          bindGroups.getBindGroupLayout0(),
          bindGroups.getBindGroupLayout1(),
        ]
      }),
    };

    return gpu.device.createRenderPipeline(pipelineDescriptor);
  }

  createApplyPipeline(shaderModule: GPUShaderModule, bindGroupLayout: GPUBindGroupLayout) {
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      label: 'Apply Outline',
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
        cullMode: "none",
        frontFace: "ccw",
      },
      layout: gpu.device.createPipelineLayout({
        label: 'Apply Outline',
        bindGroupLayouts: [
          bindGroupLayout,
        ]
      }),
    };

    return gpu.device.createRenderPipeline(pipelineDescriptor);
  }

  render(
    destinationView: GPUTextureView,
    frameBindGroup: GPUBindGroup,
    node: DrawableNodeInterface,
    commandEncoder: GPUCommandEncoder,
  ) {
    let passEncoder = commandEncoder.beginRenderPass({
      label: 'outline creation pass',
      colorAttachments: [
        {
          view: this.scratchTextureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
    });

    passEncoder.setPipeline(this.outlinePipeline);
    passEncoder.setBindGroup(0, frameBindGroup);

    const mesh = node.drawable as Mesh;

    gpu.device.queue.writeBuffer(mesh.modelMatrixBuffer, 0, mesh.modelMatrices, 0, mesh.numInstances * 16);  
    gpu.device.queue.writeBuffer(mesh.instanceColorBuffer, 0, mesh.instanceColor, 0, mesh.numInstances * 4);  
    passEncoder.setBindGroup(1, mesh.bindGroup);

    passEncoder.setVertexBuffer(0, mesh.vertexBuffer);
    passEncoder.setIndexBuffer(mesh.indexBuffer, mesh.indexFormat);

    passEncoder.drawIndexed(mesh.mesh.indexes.length, 1, 0, 0, node.instanceIndex);

    passEncoder.end();

    // Outline the image and apply to the destination.
    passEncoder = commandEncoder.beginRenderPass({
      label: 'outline apply pass',
      colorAttachments: [
        {
          view: destinationView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "load" as GPULoadOp,
          storeOp: "store" as GPUStoreOp,
        },
      ],
    });

    passEncoder.setPipeline(this.applyOutlinePipeline);
    passEncoder.setBindGroup(0, this.applyOutlineBindGroup);
    passEncoder.draw(3, 1);

    passEncoder.end();
  }
}

export default OutlinePass;
