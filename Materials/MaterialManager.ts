import Http from "../../Http/src";
import { PropertyInterface } from "../ShaderBuilder/Types";
import { shaderManager } from "../shaders/ShaderManager";
import { DrawableType, MaterialRecord } from "../types";
import Material from "./Material";
import { MaterialDescriptor } from "./MaterialDescriptor";

class MaterialManager {
  materialDescriptors: Map<number, MaterialRecord> = new Map()
  
  materials: Map<string | number, Map<string, Material>> = new Map()

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
            properties: [], // materialRecord.properties.map((p) => { }),
            shaderDescriptor: shaderDescriptor,
          }
        }
      }
      else {
        return ({
          ...materialRecord,

          shaderDescriptor: materialRecord.shaderId,
          
          properties: materialRecord.properties,
        })
      }
    }
  }

  async get(id: MaterialDescriptor | number | undefined, drawableType: DrawableType, vertexProperties: PropertyInterface[]): Promise<Material> {
    const key = JSON.stringify(id)
    const subKey = JSON.stringify({ drawableType, vertexProperties })

    let map = this.materials.get(key)

    if (!map) {      
      let descriptor: MaterialDescriptor | undefined = undefined

      if (typeof id === 'number') {
        descriptor = await this.getDescriptor(id, false)
      }
      else {
        descriptor = id
      }

      const material = await Material.create(drawableType, vertexProperties, descriptor)

      const map: Map<string, Material> = new Map()

      map.set(subKey, material)

      this.materials.set(key, map)

      return material
    }

    let material = map.get(subKey)

    if (!material) {
      let descriptor: MaterialDescriptor | undefined = undefined

      if (typeof id === 'number') {
        descriptor = await this.getDescriptor(id, false)
      }
      else {
        descriptor = id
      }

      material = await Material.create(drawableType, vertexProperties, descriptor)

      map.set(subKey, material)
    }

    return material
  }

  async applyPropertyValues(
    id: number,
    properties: PropertyInterface[]
  ) {
    const key = JSON.stringify(id)

    let map = this.materials.get(key)

    if (map) {
      for (const [, material] of map) {
        material.setPropertyValues(GPUShaderStage.FRAGMENT, properties);
      }
    }

    Http.patch(`/materials/${id}`, {
      properties
    })
  }

  setMaterialDescriptor(id: number, descriptor: MaterialDescriptor) {

  }
}

export const materialManager = new MaterialManager()
