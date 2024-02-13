import { Vec4, Mat4 } from 'wgpu-matrix';
import Drawable from './Drawable';
import Property from '../ShaderBuilder/Property';

class Reticle extends Drawable {
  private constructor(x: number, y: number, width: number, height: number) {
    super('2D')

    this.name = 'Reticle';
    
    this.vertexProperties.push(
      new Property('x', 'float', x),
      new Property('y', 'float', y),
      new Property('width', 'float', width),
      new Property('height', 'float', height),
    )
  }

  static async create(x: number, y: number, width: number, height: number): Promise<Reticle> {
    return new Reticle(x, y, width, height);
  }

  render(passEncoder: GPURenderPassEncoder) {
    passEncoder.draw(6);  
  }

  hitTest(p: Vec4, viewTransform: Mat4): { point: Vec4, t: number, drawable: Drawable} | null {
    // Transform point from model space to world space to camera space.
    // let t = mat4.multiply(mat4.inverse(viewTransform), this.getTransform());

    // let point = vec4.create(t[12], t[13], t[14], t[15])

    // const p2 = intersectionPlane(point, vec4.create(0, 0, 1, 0), vec4.create(0, 0, 0, 1), p);
  
    // if (p2) {
    //   const d = vec2.distance(point, p2)

    //   if (d < Math.abs(this.radius[0] * t[14])) {
    //     // Transform point to world space
    //     const wp = vec4.transformMat4(p2, viewTransform);

    //     return { point: wp, t: 1.0, drawable: this };
    //   }
    // }

    return null;
  }
}

export default Reticle;
