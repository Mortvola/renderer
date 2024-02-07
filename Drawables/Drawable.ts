import { Mat4, vec4, Vec4 } from 'wgpu-matrix';
import DrawableInterface from "./DrawableInterface";
import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { DrawableType, maxInstances } from '../types';
import { PropertyInterface } from '../ShaderBuilder/Types';

class Drawable implements DrawableInterface {
  drawable = true;

  type: DrawableType;

  uuid = '';

  name = '';

  tag = '';

  modelMatrices: Float32Array = new Float32Array(16 * 4 * maxInstances);

  instanceColor: Float32Array = new Float32Array(4 * maxInstances);

  numInstances = 0;

  modelMatrixBuffer: GPUBuffer;

  instanceColorBuffer: GPUBuffer;

  bindGroup: GPUBindGroup;

  vertexProperties: PropertyInterface[] = [];

  constructor(type: DrawableType) {
    this.type = type;

    const descriptor1 = {
      label: 'model Matrix',
      size: 16 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }

    this.modelMatrixBuffer = gpu.device.createBuffer(descriptor1);

    const descriptor = {
      label: 'instance color',
      size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    };

    this.instanceColorBuffer = gpu.device.createBuffer(descriptor);

    this.bindGroup = gpu.device.createBindGroup({
      label: 'bind group for instances',
      layout: bindGroups.getBindGroupLayout1(),
      entries: [
        { binding: 0, resource: { buffer: this.modelMatrixBuffer }},
        { binding: 1, resource: { buffer: this.instanceColorBuffer }},
      ],
    });
  }

  render(passEncoder: GPURenderPassEncoder, numInstances: number): void {
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
  
      this.instanceColor[this.numInstances * 4 + 0] = color[0]
      this.instanceColor[this.numInstances * 4 + 1] = color[1]
      this.instanceColor[this.numInstances * 4 + 2] = color[2]
      this.instanceColor[this.numInstances * 4 + 3] = color[3]
  
      this.numInstances += 1;  
    }
  }
}

export default Drawable;
