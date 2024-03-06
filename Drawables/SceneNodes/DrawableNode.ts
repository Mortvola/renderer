import { Vec4, mat4, vec4 } from "wgpu-matrix";
import DrawableInterface from "../DrawableInterface";
import SceneNode from "./SceneNode";
import { DrawableNodeInterface, MaterialInterface } from "../../types";
import Material from "../../Materials/Material";
import { MaterialDescriptor } from "../../Materials/MaterialDescriptor";
import { materialManager } from "../../Materials/MaterialManager";

const materialsMap: Map<string, Material> = new Map()

class DrawableNode extends SceneNode implements DrawableNodeInterface {
  drawable: DrawableInterface;

  material: MaterialInterface;

  color = new Float32Array(4);

  instanceIndex = 0;

  private constructor(drawable: DrawableInterface, material: MaterialInterface) {
    super();
    this.drawable = drawable;
    this.material = material;
    this.color = material.color.slice();
  }

  static async create(drawable: DrawableInterface, materialDescriptor?: MaterialDescriptor | number): Promise<DrawableNode> {
    const material = await materialManager.get(materialDescriptor, drawable.type, drawable.vertexProperties)

    return new DrawableNode(drawable, material);
  }

  hitTest(origin: Vec4, vector: Vec4): { point: Vec4, t: number, drawable: DrawableInterface} | null {
    // Transform origin and ray into model space.
    const inverseTransform = mat4.inverse(this.getTransform());
    const localVector = vec4.transformMat4(vector, inverseTransform);
    const localOrigin = vec4.transformMat4(origin, inverseTransform);

    const result = this.drawable.hitTest(localOrigin, localVector);

    if (result) {
      // Convert the intersection point into world coordinates.
      const point = vec4.transformMat4(result.point, this.getTransform());

      return { point, t: result.t, drawable: this.drawable };      
    }

    return null;
  }

  computeTransform(transform = mat4.identity(), prepend = true): void {
    super.computeTransform(transform, prepend);

    this.instanceIndex = this.drawable.numInstances;
    
    this.drawable.addInstanceInfo(this.transform, this.color);
  }

}

export default DrawableNode;
