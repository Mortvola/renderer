import { GraphDescriptor } from "../shaders/ShaderBuilder/GraphDescriptor";

export type TextureDescriptor = {
  url: string,

  scale?: [number, number],

  offset?: [number, number],
}

export type MaterialDescriptor = {
  type: 'Circle' | 'Line' | 'Lit' | 'Trajectory';

  cullMode?: 'back' | 'none',

  color?: number[],

  transparent?: boolean,

  graph?: GraphDescriptor,
}
