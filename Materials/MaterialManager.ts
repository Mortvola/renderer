import Http from "../../Http/src";
import { PropertyInterface } from "../ShaderBuilder/Types";
import { shaderManager } from "../shaders/ShaderManager";
import { DrawableType, MaterialRecord } from "../types";
import Material from "./Material";
import { MaterialDescriptor } from "./MaterialDescriptor";

class MaterialManager {
  materialDescriptors: Map<number, MaterialRecord> = new Map()
  
  materials: Map<string, Material> = new Map()

  async getDescriptor(id: number, withShaderDescriptor = true): Promise<MaterialDescriptor | undefined> {
    let materialRecord = this.materialDescriptors.get(id)

    if (!materialRecord) {
      const response = await Http.get<MaterialRecord>(`/materials/${id}`);

      if (response.ok) {
        materialRecord = await response.body();

        this.materialDescriptors.set(id, materialRecord)
      }  
    }

    if (materialRecord) {
      if (withShaderDescriptor) {
        const shaderDescriptor = await shaderManager.getDescriptor(materialRecord.shaderId);

        if (shaderDescriptor) {
          return {
            properties: {}, // materialRecord.properties.map((p) => { }),
            shaderDescriptor: shaderDescriptor,
          }
        }
      }
      else {
        return ({
          ...materialRecord,

          shaderDescriptor: materialRecord.shaderId,
          
          properties: materialRecord.properties.reduce<Record<string, number | string>>((result, p) => {
            if (typeof p.value.value === 'string') {
              result[p.name] = p.value.value
            }

            if (typeof p.value.value === 'number') {
              result[p.name] = p.value.value
            }

            return result
          }, {})
        })
      }
    }
  }

  async get(id: number, drawableType: DrawableType, vertexProperties: PropertyInterface[]): Promise<Material> {
    const key = JSON.stringify({
      id,
      drawableType,
      vertexProperties,
    })

    let material = this.materials.get(key)

    if (!material) {
      const descriptor = await this.getDescriptor(id, false)

      material = await Material.create(drawableType, vertexProperties, descriptor)

      this.materials.set(key, material)
    }

    return material
  }

  async applyPropertyValues(
    id: number,
    drawableType: DrawableType,
    vertexProperties: PropertyInterface[],
    properties: PropertyInterface[]
  ) {
    const key = JSON.stringify({
      id,
      drawableType,
      vertexProperties,
    })

    let material = this.materials.get(key)

    if (material) {
      material.setPropertyValues(GPUShaderStage.FRAGMENT, properties);
    }
  }

  setMaterialDescriptor(id: number, descriptor: MaterialDescriptor) {

  }
}

export const materialManager = new MaterialManager()
