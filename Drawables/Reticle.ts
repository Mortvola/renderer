import { Vec4, Mat4 } from 'wgpu-matrix';
import Drawable from './Drawable';
import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';

class Reticle extends Drawable {
  radius = new Float32Array(1);

  bindGroup3: GPUBindGroup;

  uniformBuffer3: GPUBuffer;

  private constructor(radius: number) {
    super('Billboard')

    this.name = 'Reticle';
    
    this.radius[0] = radius;

    this.uniformBuffer3 = gpu.device.createBuffer({
      label: 'radius',
      size: Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup3 = gpu.device.createBindGroup({
      label: 'radius',
      layout: bindGroups.getBindGroupLayout3(),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer3 }},
      ],
    });
  }

  static async create(radius: number): Promise<Reticle> {
    return new Reticle(radius);
  }

  render(passEncoder: GPURenderPassEncoder) {
    gpu.device.queue.writeBuffer(this.uniformBuffer3, 0, this.radius);

    passEncoder.setBindGroup(3, this.bindGroup3);

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
