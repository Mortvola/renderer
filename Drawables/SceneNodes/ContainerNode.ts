import { Vec4, mat4 } from 'wgpu-matrix';
import DrawableInterface from "../DrawableInterface";
import SceneNode from "./SceneNode";
import { ContainerNodeInterface, SceneNodeInterface, RendererInterface } from '../../types';
import { isDrawableNode } from './utils';

export type HitTestResult = {
  drawable: DrawableInterface,
  t: number,
  point: Vec4,
}

class ContainerNode extends SceneNode implements ContainerNodeInterface {
  nodes: SceneNodeInterface[] = [];

  addNode(node: SceneNodeInterface) {
    this.nodes.push(node);
  }

  removeNode(node: SceneNodeInterface) {
    const index = this.nodes.findIndex((n) => n === node);

    if (index !== -1) {
      this.nodes = [
        ...this.nodes.slice(0, index),
        ...this.nodes.slice(index + 1)
      ]
    }
  }

  findNode(node: SceneNode) {
    const index = this.nodes.findIndex((n) => n === node);

    if (index === -1) {
      console.log('node not found!!!!')
    }
  }

  updateTransforms(mat = mat4.identity(), renderer: RendererInterface) {
    const transform = this.computeTransform(mat);
    for (const drawable of this.nodes) {
      if (isDrawableNode(drawable)) {
        drawable.computeTransform(transform);

        if (drawable.material.transparent) {
          renderer.transparentPass.addDrawable(drawable);
        }
        else {
          renderer.mainRenderPass.addDrawable(drawable);
        }
      }
      else if (isContainerNode(drawable)) {
        drawable.updateTransforms(transform, renderer);
      }
    }
  }

  modelHitTest(origin: Vec4, ray: Vec4, filter?: (node: DrawableInterface) => boolean): HitTestResult | null {
    let best: HitTestResult | null = null;

    for (const node of this.nodes) {
      let result;
      if (isDrawableNode(node)) {
        if (!filter || filter(node.drawable)) {
          result = node.hitTest(origin, ray)    
        }
      }
      else if (isContainerNode(node)) {
        result = node.modelHitTest(origin, ray, filter);
      }

      if (result) {
        if (best === null || result.t < best.t) {
          best = {
            drawable: result.drawable,
            t: result.t,
            point: result.point,
          }
        }
      }  
    }

    return best;
  }
}

export const isContainerNode = (r: unknown): r is ContainerNode => (
  (r as ContainerNode).nodes !== undefined
)

export default ContainerNode;
