import { GraphDescriptor } from "../ShaderBuilder/GraphDescriptor";
import { ValueType, DataType } from "../ShaderBuilder/Types";

export type ShaderDescriptor = {
  type: 'Circle' | 'Line' | 'Lit' | 'Trajectory' | 'Billboard' | 'Reticle';

  cullMode?: 'back' | 'none',

  color?: number[],

  transparent?: boolean,

  depthWriteEnabled?: boolean,

  lit?: boolean,

  properties?: { name: string, dataType: DataType, value: ValueType }[],

  graph?: GraphDescriptor,
}
