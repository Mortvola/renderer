import { GraphDescriptor } from "../ShaderBuilder/GraphDescriptor";
import { ValueType, DataType } from "../ShaderBuilder/Types";

export type ShaderDescriptor = {
  type?: 'Line' | 'Trajectory' | 'Decal';

  cullMode?: 'back' | 'none',

  color?: number[],

  transparent?: boolean,

  depthWriteEnabled?: boolean,

  lit?: boolean,

  decal?: boolean,

  properties?: { name: string, dataType: DataType, value: ValueType }[],

  graph?: GraphDescriptor,
}
