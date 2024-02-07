import { Vec4, Mat4 } from 'wgpu-matrix';
import Drawable from './Drawable';

class Billboard extends Drawable {
  constructor() {
    super('Billboard');

    this.name = 'Billboard'
  }

  render(passEncoder: GPURenderPassEncoder, numInstances: number) {
    // TODO: determine how many lines should be rendered based on radius?
    passEncoder.draw(6, numInstances);  
  }

  hitTest(p: Vec4, viewTransform: Mat4): { point: Vec4, t: number, drawable: Drawable} | null {
    return null;
  }
}

export default Billboard;
