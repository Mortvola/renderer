import { GraphDescriptor } from "../ShaderBuilder/GraphDescriptor";
import { ValueType, DataType } from "../ShaderBuilder/Types";

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

  depthWriteEnabled?: boolean,

  lit?: boolean,

  properties?: { name: string, dataType: DataType, value: ValueType }[],

  graph?: GraphDescriptor,
}
