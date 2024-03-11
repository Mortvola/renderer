import { mat4, vec4, Vec4 } from 'wgpu-matrix';
import SceneNode from './SceneNodes/SceneNode';

class Light extends SceneNode {
  lightColor = vec4.create(1, 1, 1, 1);

  worldPosition = vec4.create(0, 0, 0, 0);

  constant = 1.0;

  linear = 0.09;

  quadratic = 0.032;
  
  computeCentroid(): Vec4 {
    return vec4.create(0, 0, 0, 1);
  }

  computeTransform(transform = mat4.identity(), prepend = true): void {
    super.computeTransform(transform, prepend);

    this.worldPosition = vec4.transformMat4(vec4.create(0, 0, 0, 1), this.transform)
  }
}

export const isLight = (r: unknown): r is Light => (
  (r as Light).lightColor !== undefined
)

export default Light;
