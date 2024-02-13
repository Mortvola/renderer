import { Vec4, Mat4 } from 'wgpu-matrix';
import Drawable from './Drawable';
import Value from '../ShaderBuilder/Value';
import Property from '../ShaderBuilder/Property';

class Circle extends Drawable {
  constructor(radius: number, thickness: number, color: Vec4) {
    super('Circle')

    this.name = 'Circle'
    
    this.vertexProperties.push(
      new Property('radius', 'float', radius),
      new Property('thickness', 'float', thickness),
      new Property('numSegments', 'float', 64),
    )
  }

  render(passEncoder: GPURenderPassEncoder) {
    const numSegments = 64;

    // TODO: determine how many lines should be rendered based on radius?
    passEncoder.draw(numSegments * 2 * 3);  
  }

  hitTest(p: Vec4, viewTransform: Mat4): { point: Vec4, t: number, drawable: Drawable} | null {
    return null;
  }
}

export default Circle;
