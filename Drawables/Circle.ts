import { Vec4, Mat4 } from 'wgpu-matrix';
import Drawable from './Drawable';
import { circleShader } from '../shaders/circle';
import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import { bindGroups } from '../BindGroups';
import { gpu } from '../Gpu';
import Value from '../ShaderBuilder/Value';

const defs = makeShaderDataDefinitions(circleShader);

class Circle extends Drawable {
  circleStructure = makeStructuredView(defs.structs.Circle);

  bindGroup3: GPUBindGroup;

  circleDataBuffer: GPUBuffer;

  circleData = new Float32Array(4);

  constructor(radius: number, thickness: number, color: Vec4) {
    super('Circle')

    this.name = 'Circle'
    
    this.vertexProperties.push(
      { name: 'radius', value: new Value('float', radius), builtin: false },
      { name: 'thickness', value: new Value('float', thickness), builtin: false },
      { name: 'numSegments', value: new Value('float', 64), builtin: false },
    )

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

    // TODO: determine how many lines should be rendered based on radius?
    passEncoder.draw(numSegments * 2 * 3);  
  }

  hitTest(p: Vec4, viewTransform: Mat4): { point: Vec4, t: number, drawable: Drawable} | null {
    return null;
  }
}

export default Circle;
