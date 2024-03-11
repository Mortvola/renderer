import { RendererInterface, SceneGraphInterface, SceneNodeInterface, SceneObjectInterface } from "../../types";
import Light, { isLight } from "../Light";
import RangeCircle from "../RangeCircle";
import ContainerNode, { isContainerNode } from "./ContainerNode";

class SceneGraph implements SceneGraphInterface {
  scene = new ContainerNode()

  lights: Set<Light> = new Set();

  rangeCircles: Set<RangeCircle> = new Set();

  addNode(node: SceneNodeInterface) {
    this.scene.addNode(node);

    let stack: SceneNodeInterface[] = [node]

    while (stack.length > 0) {
      const n = stack[0];
      stack = stack.slice(1);

      if (isContainerNode(n)) {
        stack.push(...n.nodes)
      }
      else if (isRangeCircle(n)) {
        this.rangeCircles.add(n)
      }
      else if (isLight(n)) {
        this.lights.add(n)
      }
    }
  }

  addSceneObject(object: SceneObjectInterface) {
    this.addNode(object.sceneNode)
  }

  removeNode(node: SceneNodeInterface) {
    this.scene.removeNode(node);

    let stack: SceneNodeInterface[] = [node]

    while (stack.length > 0) {
      const n = stack[0];
      stack = stack.slice(1);

      if (isContainerNode(n)) {
        stack.push(...n.nodes)
      }
      else if (isRangeCircle(n)) {
        this.rangeCircles.delete(n)
      }
      else if (isLight(n)) {
        this.lights.delete(n)
      }
    }
  }

  removeSceneObject(object: SceneObjectInterface) {
    this.removeNode(object.sceneNode)
  }

  updateTransforms(renderer: RendererInterface | null) {
    this.scene.updateTransforms(undefined, renderer);
  }

  getRangeCircles() : RangeCircle[] {
    const circles: RangeCircle[] = [];

    this.rangeCircles.forEach((c) => circles.push(c))
    
    return circles
  }

  getLights() : Light[] {
    const lights: Light[] = [];

    this.lights.forEach((c) => lights.push(c))
    
    return lights
  }
}

const isRangeCircle = (r: unknown): r is RangeCircle => (
  (r as RangeCircle).radius !== undefined
  && (r as RangeCircle).thickness !== undefined
)

export default SceneGraph;
