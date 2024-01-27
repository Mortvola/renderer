import { Vec3, Vec4, Mat4, Quat } from 'wgpu-matrix';
import { StructuredView } from 'webgpu-utils';
import DrawableInterface from './Drawables/DrawableInterface';
import { PropertyInterface } from './ShaderBuilder/Types';

export const maxInstances = 16;

export interface ContainerNodeInterface {
  addNode(node: SceneNodeInterface): void;

  removeNode(node: SceneNodeInterface): void;
}

export interface RenderPassInterface {
  addDrawable(drawable: DrawableNodeInterface): void;
}

export interface RendererInterface {
  scene: ContainerNodeInterface;

  mainRenderPass: RenderPassInterface;

  transparentPass: RenderPassInterface;
}

export interface SceneNodeInterface {
  uuid: string;

  name: string;

  translate: Vec3;

  qRotate: Quat;

  angles: number[];

  scale: Vec3;

  transform: Mat4;

  computeTransform(transform: Mat4, prepend?: boolean): Mat4;

  setFromAngles(x: number, y: number, z: number): void;
}

export interface MaterialInterface {
  pipeline: PipelineInterface | null;

  color: Float32Array;

  drawables: DrawableInterface[];

  colorBuffer: GPUBuffer;

  uniformsBuffer: GPUBuffer | null;

  textureAttributesBuffer: GPUBuffer | null;
  
  bindGroup: GPUBindGroup;

  transparent: boolean;

  addDrawable(drawableNode: DrawableNodeInterface): void;
}

export interface DrawableNodeInterface extends SceneNodeInterface {
  drawable: DrawableInterface;

  material: MaterialInterface;
  
  hitTest(origin: Vec4, vector: Vec4): { point: Vec4, t: number, drawable: DrawableInterface} | null;
}

export interface PipelineInterface {
  pipeline: GPURenderPipeline | null;

  // drawables: DrawableInterface[];
  materials: MaterialInterface[];

  addDrawable(drawable: DrawableNodeInterface): void;

  // removeDrawable(drawable: DrawableNodeInterface): void;

  render(passEncoder: GPURenderPassEncoder): void;
}

export type PipelineAttributes = {

}

export interface PipelineManagerInterface {
  getPipelineByArgs(
    args: PipelineAttributes,
  ): [PipelineInterface, GPUBindGroupLayout | null, PropertyInterface[], StructuredView | null, boolean];
}
