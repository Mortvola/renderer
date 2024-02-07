import Http from "../../Http/src";
import { ShaderRecord } from "../../Project/Types/types";
import { ShaderDescriptor } from "./ShaderDescriptor";

class ShaderManager {
  shaders: Map<number, ShaderRecord> = new Map()

  async getDescriptor(id: number): Promise<ShaderDescriptor | undefined> {
    let shaderRecord = this.shaders.get(id)

    if (!shaderRecord) {
      const response = await Http.get<ShaderRecord>(`/shader-descriptors/${id}`)

      if (response.ok) {
        shaderRecord = await response.body();
  
        this.shaders.set(id, shaderRecord)
      }
    }

    if (shaderRecord) {
      return shaderRecord.descriptor
    }
  }
}

export const shaderManager = new ShaderManager()
