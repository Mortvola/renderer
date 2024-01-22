import { common } from "./common";

export const trajectoryShader = /*wgsl*/`

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

${common}

struct Trajectory {
  numSegments: f32,
  startPosition: vec4f,
  velocity: vec2f,
  gravity: f32,
  duration: f32,
  orientation: vec4f,
}

@group(3) @binding(0) var<uniform> trajectory: Trajectory;

@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VertexOut
{
  var output : VertexOut;

  var elapsedTime = (trajectory.duration / trajectory.numSegments) * f32(vertexIndex);

  var xPos = trajectory.velocity[0] * elapsedTime;
  var yPos = trajectory.velocity[1] * elapsedTime + 0.5 * trajectory.gravity * elapsedTime * elapsedTime;
  
  var xz = trajectory.orientation * xPos;

  var position = vec4f(
    trajectory.startPosition[0] + xz[0],
    trajectory.startPosition[1] + yPos,
    trajectory.startPosition[2] + xz[2],
    1
  );

  output.position = projectionMatrix * viewMatrix * position;
  output.color = vec4f(1.0, 1.0, 1.0, 1.0);

  return output;
}

@fragment
fn fs(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color;
}
`
