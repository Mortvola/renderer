import { Vec4, Mat4 } from 'wgpu-matrix';

interface DrawableInterface {
  drawable: boolean;

  uuid: string;

  name: string;

  tag: string;

  modelMatrices: Float32Array
  
  modelMatrixBuffer: GPUBuffer;

  // color: Float32Array;

  // colorBuffer: GPUBuffer;

  bindGroup: GPUBindGroup;

  numInstances: number;

  render(passEncoder: GPURenderPassEncoder, numInstances: number): void;

  setColor(color: Vec4): void;

  getColor(): Float32Array;

  hitTest(origin: Vec4, vector: Vec4): { point: Vec4, t: number, drawable: DrawableInterface} | null;

  computeCentroid(): Vec4;

  addInstanceTransform(mat4: Mat4): void;
}

export const isDrawableInterface = (r: unknown): r is DrawableInterface => (
  (r as DrawableInterface).drawable !== undefined
)

export default DrawableInterface;
