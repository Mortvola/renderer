import { Mat4, vec4, Vec4 } from 'wgpu-matrix';
import DrawableInterface from "./DrawableInterface";
import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import { maxInstances } from '../types';

class Drawable implements DrawableInterface {
  drawable = true;

  uuid = '';

  name = '';

  tag = '';

  color = new Float32Array(4);

  // colorBuffer: GPUBuffer;

  modelMatrices: Float32Array = new Float32Array(16 * maxInstances);

  numInstances = 0;

  modelMatrixBuffer: GPUBuffer;

  bindGroup: GPUBindGroup;

  // bindGroup2: GPUBindGroup;

  constructor() {
    this.color[0] = 0.8;
    this.color[1] = 0.8;
    this.color[2] = 0.8;
    this.color[3] = 1.0;

    // this.colorBuffer = gpu.device.createBuffer({
    //   label: 'color',
    //   size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });

    this.modelMatrixBuffer = gpu.device.createBuffer({
      label: 'model Matrix',
      size: 16 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = gpu.device.createBindGroup({
      label: 'bind group for model matrix',
      layout: bindGroups.getBindGroupLayout1(),
      entries: [
        { binding: 0, resource: { buffer: this.modelMatrixBuffer }},
      ],
    });

    // this.bindGroup2 = gpu.device.createBindGroup({
    //   label: 'Color',
    //   layout: bindGroups.getBindGroupLayout2A(),
    //   entries: [
    //     { binding: 0, resource: { buffer: this.colorBuffer }},
    //   ],
    // });
  }

  render(passEncoder: GPURenderPassEncoder, numInstances: number): void {
    throw new Error('render not implemented')
  }

  setColor(color: Vec4) {
    throw new Error('not implemented');
  }

  getColor(): Float32Array {
    throw new Error('not implemented');
  }

  hitTest(origin: Vec4, vector: Vec4): { point: Vec4, t: number, drawable: DrawableInterface} | null {
    return null;
  }

  computeCentroid(): Vec4 {
    return vec4.create();
  }

  addInstanceTransform(transform: Mat4) {
    transform.forEach((float, index) => {
      this.modelMatrices[this.numInstances * 16 + index] = float;
    })

    this.numInstances += 1;
  }
}

export default Drawable;
