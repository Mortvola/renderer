import { Vec4, Mat4 } from 'wgpu-matrix';
import Drawable from './Drawable';
import { circleShader } from '../shaders/circle';
import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';

const defs = makeShaderDataDefinitions(circleShader);

class Circle extends Drawable {
  radius: number;

  thickness: number;

  color = new Float32Array(4);

  circleStructure = makeStructuredView(defs.structs.Circle);

  bindGroup3: GPUBindGroup;

  circleDataBuffer: GPUBuffer;

  circleData = new Float32Array(4);

  constructor(radius: number, thickness: number, color: Vec4) {
    super()

    this.radius= radius;
    this.thickness = thickness;

    this.color[0] = color[0];
    this.color[1] = color[1];
    this.color[2] = color[2];
    this.color[3] = color[3];
    
    this.circleDataBuffer = gpu.device.createBuffer({
      label: 'Circle',
      size: this.circleStructure.arrayBuffer.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup3 = gpu.device.createBindGroup({
      label: 'Circle',
      layout: bindGroups.getBindGroupLayout3(),
      entries: [
        { binding: 0, resource: { buffer: this.circleDataBuffer }},
      ],
    });
  }

  render(passEncoder: GPURenderPassEncoder) {
    const numSegments = 64;

    this.circleStructure.set({
      radius: this.radius,
      numSegments: numSegments,
      thickness: this.thickness,
      color: this.color,
    });

    gpu.device.queue.writeBuffer(this.circleDataBuffer, 0, this.circleStructure.arrayBuffer);

    // passEncoder.setBindGroup(2, this.bindGroup2);
    passEncoder.setBindGroup(3, this.bindGroup3);

    // TODO: determine how many lines should be rendered based on radius?
    passEncoder.draw(numSegments * 2 * 3);  
  }

  hitTest(p: Vec4, viewTransform: Mat4): { point: Vec4, t: number, drawable: Drawable} | null {
    return null;
  }
}

export default Circle;
