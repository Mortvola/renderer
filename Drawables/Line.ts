import { gpu } from "../Gpu";
import Drawable from "./Drawable";

class Line extends Drawable {
  vertices: number[];

  vertexBuffer: GPUBuffer;

  constructor(p1: number[][]) {
    super('Line', 1);

    this.name = 'Line'
  
    this.vertices = p1.flatMap((p) => p)

    this.vertexBuffer = gpu.device.createBuffer({
      size: this.vertices.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });  
    {
      const mapping = new Float32Array(this.vertexBuffer.getMappedRange());
      mapping.set(this.vertices, 0);
      this.vertexBuffer.unmap();  
    }
  }

  render(passEncoder: GPURenderPassEncoder) {
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.draw(this.vertices.length / 8);  
  }
}

export default Line;
