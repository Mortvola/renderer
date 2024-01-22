import { Vec2, Vec4 } from "wgpu-matrix";
import { bindGroups } from '../BindGroups';
import Drawable from "./Drawable";
import { makeShaderDataDefinitions, makeStructuredView } from "webgpu-utils";
import { trajectoryShader } from "../shaders/trajectory";
import { gravity } from "../Math";
import { gpu } from "../Gpu";

const defs = makeShaderDataDefinitions(trajectoryShader);

type TrajectoryData = {
  velocityVector: Vec2,
  duration: number,
  startPos: Vec4,
  orientation: Vec4,
  distance: number,
};

const label = 'trajectory';

class Trajectory extends Drawable {

  trajectoryStructure = makeStructuredView(defs.structs.Trajectory);

  trajectoryData: TrajectoryData;

  trajectoryBuffer: GPUBuffer;

  trajectoryBindGroup: GPUBindGroup;

  constructor(trajectoryData: TrajectoryData) {
    super();
  
    this.trajectoryData = trajectoryData;

    this.trajectoryBuffer = gpu.device.createBuffer({
      label,
      size: this.trajectoryStructure.arrayBuffer.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.trajectoryBindGroup = gpu.device.createBindGroup({
      label,
      layout: bindGroups.getBindGroupLayout3(),
      entries: [
        { binding: 0, resource: { buffer: this.trajectoryBuffer }},
      ],
    });
  }

  render(passEncoder: GPURenderPassEncoder) {
    const numSegments = this.trajectoryData.distance * 4;
    
    // Update the trajectory information
    this.trajectoryStructure.set({
      numSegments: numSegments,
      startPosition: this.trajectoryData.startPos,
      velocity: this.trajectoryData.velocityVector,
      gravity: gravity,
      duration: this.trajectoryData.duration,
      orientation: this.trajectoryData.orientation,
    });

    gpu.device.queue.writeBuffer(this.trajectoryBuffer, 0, this.trajectoryStructure.arrayBuffer);

    passEncoder.setBindGroup(2, null);
    passEncoder.setBindGroup(3, this.trajectoryBindGroup);

    // TODO: determine how many lines should be rendered based on length of arc?
    passEncoder.draw(numSegments);  
  }
}

export default Trajectory;
