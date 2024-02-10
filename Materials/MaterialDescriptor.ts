import { PropertyInterface } from "../ShaderBuilder/Types";
import { ShaderDescriptor } from "../shaders/ShaderDescriptor";

export type MaterialDescriptor = {
  properties?: PropertyInterface[],

  shaderDescriptor?: ShaderDescriptor | number,
}
