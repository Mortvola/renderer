import Http from "../../Http/src";
import { shaderManager } from "../shaders/ShaderManager";
import { MaterialRecord } from "../types";
import { MaterialDescriptor } from "./MaterialDescriptor";

class MaterialManager {
  materials: Map<number, MaterialRecord> = new Map()

  async getDescriptor(id: number): Promise<MaterialDescriptor | undefined> {
    let materialRecord = this.materials.get(id)

    if (!materialRecord) {
      const response = await Http.get<MaterialRecord>(`/materials/${id}`);

      if (response.ok) {
        materialRecord = await response.body();

        this.materials.set(id, materialRecord)
      }  
    }

    if (materialRecord) {
      const shaderDescriptor = await shaderManager.getDescriptor(materialRecord.shaderId);

      if (shaderDescriptor) {
        return {
          properties: [], // materialRecord.properties.map((p) => { }),
          shaderDescriptor: shaderDescriptor,
        }
      }
    }
  }

  setMaterialDescriptor(id: number, descriptor: MaterialDescriptor) {

  }
}

export const materialManager = new MaterialManager()
