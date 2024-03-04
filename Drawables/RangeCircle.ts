import { Vec3, vec4, Vec4 } from 'wgpu-matrix';
import SceneNode from './SceneNodes/SceneNode';

class RangeCircle extends SceneNode {
  color;

  radius: number;

  thickness: number;

  constructor(position: Vec3, radius: number, thickness: number, color = vec4.create(1, 1, 1, 1)) {
    super()

    this.translate[0] = position[0];
    this.translate[1] = position[1];
    this.translate[2] = position[2];

    this.radius = radius;
    this.thickness = thickness;
    this.color = color;
  }

  computeCentroid(): Vec4 {
    return vec4.create(0, 0, 0, 1);
  }
}

// export const isLight = (r: unknown): r is Light => (
//   (r as Circle).lightColor !== undefined
// )

export default RangeCircle;
