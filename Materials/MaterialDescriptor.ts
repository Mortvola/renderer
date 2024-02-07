import { ShaderDescriptor } from "../shaders/ShaderDescriptor";

export type MaterialDescriptor = {
  properties?: Record<string, number | string>[],

  shaderDescriptor: ShaderDescriptor,
}
