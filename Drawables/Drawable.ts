import { mat4, Mat4, vec4, Vec4 } from 'wgpu-matrix';
import DrawableInterface from "./DrawableInterface";
import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { DrawableType, maxInstances } from '../types';
import { PropertyInterface } from '../ShaderBuilder/Types';
import { meshInstances } from '../shaders/meshInstances';
import { makeShaderDataDefinitions, makeStructuredView, makeTypedArrayViews } from 'webgpu-utils';

const dataDefs = makeShaderDataDefinitions(meshInstances)

class Drawable implements DrawableInterface {
  drawable = true;

  type: DrawableType;

  uuid = '';

  name = '';

  tag = '';

  id = 0;

  modelMatrices: Float32Array = new Float32Array(16 * 4 * maxInstances);

  inverseModelMatrices: Float32Array = new Float32Array(16 * 4 * maxInstances);

  instanceInfo = makeStructuredView(dataDefs.uniforms.instanceInfo);

  numInstances = 0;

  modelMatrixBuffer: GPUBuffer;

  inverseModelMatrixBuffer: GPUBuffer;

  instanceColorBuffer: GPUBuffer;

  bindGroup: GPUBindGroup;

  vertexProperties: PropertyInterface[] = [];

  constructor(type: DrawableType, id: number) {
    this.type = type;
    this.id = id;

    const matrixDescriptor = {
      label: 'model Matrix',
      size: 16 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }

    this.modelMatrixBuffer = gpu.device.createBuffer(matrixDescriptor);
    this.inverseModelMatrixBuffer = gpu.device.createBuffer(matrixDescriptor);

    const descriptor = {
      label: 'instance color',
      // size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      size: this.instanceInfo.arrayBuffer.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    };

    this.instanceColorBuffer = gpu.device.createBuffer(descriptor);

    this.bindGroup = gpu.device.createBindGroup({
      label: 'bind group for instances',
      layout: bindGroups.getBindGroupLayout1(),
      entries: [
        { binding: 0, resource: { buffer: this.modelMatrixBuffer }},
        { binding: 1, resource: { buffer: this.instanceColorBuffer }},
        { binding: 2, resource: { buffer: this.inverseModelMatrixBuffer }},
      ],
    });
  }

  render(passEncoder: GPURenderPassEncoder): void {
    throw new Error('render not implemented')
  }

  hitTest(origin: Vec4, vector: Vec4): { point: Vec4, t: number, drawable: DrawableInterface} | null {
    return null;
  }

  computeCentroid(): Vec4 {
    return vec4.create();
  }

  addInstanceInfo(transform: Mat4, color: Vec4) {
    if (this.numInstances < maxInstances) {
      transform.forEach((float, index) => {
        this.modelMatrices[this.numInstances * 16 + index] = float;
      })

      mat4.inverse(transform).forEach((float, index) => {
        this.inverseModelMatrices[this.numInstances * 16 + index] = float;
      })

      this.instanceInfo.views[this.numInstances].color[0] = color[0]
      this.instanceInfo.views[this.numInstances].color[1] = color[1]
      this.instanceInfo.views[this.numInstances].color[2] = color[2]
      this.instanceInfo.views[this.numInstances].color[3] = color[3]
  
      this.instanceInfo.views[this.numInstances].id[0] = this.id;

      this.numInstances += 1;  
    }
  }
}

export default Drawable;
