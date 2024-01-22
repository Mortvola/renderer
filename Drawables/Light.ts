import { vec4, Vec4 } from 'wgpu-matrix';
import SceneNode from './SceneNodes/SceneNode';

class Light extends SceneNode {
  lightColor = vec4.create(1, 1, 1, 1);

  computeCentroid(): Vec4 {
    return vec4.create(0, 0, 0, 1);
  }
}

export const isLight = (r: unknown): r is Light => (
  (r as Light).lightColor !== undefined
)

export default Light;
