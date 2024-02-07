import { Vec3, Vec4, Mat4, Quat } from 'wgpu-matrix';
import { StructuredView } from 'webgpu-utils';
import DrawableInterface from './Drawables/DrawableInterface';
import { PropertyInterface, ValueType } from './ShaderBuilder/Types';
import { MaterialDescriptor } from './Materials/MaterialDescriptor';

export const maxInstances = 1000;

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

  addParticleSystem(particleSystem: ParticleSystemInterface): void;
}

export interface SceneNodeInterface {
  uuid: string;

  name: string;

  translate: Vec3;

  qRotate: Quat;

  angles: number[];

  scale: Vec3;

  transform: Mat4;

  computeTransform(transform: Mat4, prepend?: boolean): void;

  setFromAngles(x: number, y: number, z: number): void;
}

export type DrawableType = 'Mesh' | 'Billboard' | 'Circle' | 'Line'

export interface MaterialInterface {
  pipeline: PipelineInterface | null;

  color: Float32Array;

  drawables: DrawableInterface[];

  transparent: boolean;

  setBindGroups(passEncoder: GPURenderPassEncoder): void;

  addDrawable(drawableNode: DrawableNodeInterface): void;

  updateProperty(stage: GPUShaderStageFlags, name: string, value: ValueType): void;
}

export interface DrawableNodeInterface extends SceneNodeInterface {
  drawable: DrawableInterface;

  material: MaterialInterface;
  
  color: Float32Array;

  hitTest(origin: Vec4, vector: Vec4): { point: Vec4, t: number, drawable: DrawableInterface} | null;
}

export interface PipelineInterface {
  pipeline: GPURenderPipeline;

  // drawables: DrawableInterface[];
  materials: MaterialInterface[];

  addDrawable(drawable: DrawableNodeInterface): void;

  // removeDrawable(drawable: DrawableNodeInterface): void;

  render(passEncoder: GPURenderPassEncoder): void;
}

export type PipelineAttributes = {

}

export type StageBindings = {
  binding: number,
  layout: GPUBindGroupLayout | null,
  properties: PropertyInterface[],
  structuredView: StructuredView | null,
}

export interface PipelineManagerInterface {
  getPipeline(
    drawableType: DrawableType,
    vertexProperties: PropertyInterface[],
    args: MaterialDescriptor,
  ): [PipelineInterface, StageBindings | null, StageBindings | null, boolean];
}

export interface ParticleSystemInterface {
  angle: number

  update(time: number, elapsedTime: number, scene: ContainerNodeInterface): Promise<void>

  removePoints(scene: ContainerNodeInterface): void
}
