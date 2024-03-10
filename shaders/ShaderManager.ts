import Http from "../../Http/src";
import { ShaderRecord } from "../types";
import { ShaderDescriptor } from "./ShaderDescriptor";

class ShaderManager {
  shaders: Map<number, ShaderRecord> = new Map()

  async getDescriptor(id: number): Promise<ShaderDescriptor | undefined> {
    let shaderRecord = this.shaders.get(id)

    if (!shaderRecord) {
      if (id === -1) {
        shaderRecord = {
          id: -1,
          name: 'Decal',
          descriptor: {
            type: 'Decal',
            properties: [
              { name: 'albedo', dataType: 'texture2D', value: null }
            ]
          },  
        }      

        this.shaders.set(id, shaderRecord)
      }
      else {
        const response = await Http.get<ShaderRecord>(`/shader-descriptors/${id}`)

        if (response.ok) {
          shaderRecord = await response.body();
    
          this.shaders.set(id, shaderRecord)
        }  
      }
    }

    if (shaderRecord) {
      return shaderRecord.descriptor
    }
  }
}

export const shaderManager = new ShaderManager()
