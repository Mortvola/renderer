import { common } from "./common";
import { meshInstances } from "./meshInstances";

export const trajectoryShader = /*wgsl*/`

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

${common}

${meshInstances}

struct Trajectory {
  numSegments: f32,
  startPosition: vec4f,
  velocity: vec2f,
  gravity: f32,
  duration: f32,
  orientation: vec4f,
}

@group(2) @binding(0) var<uniform> trajectory: Trajectory;

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

struct FragmentOut {
  @location(0) color: vec4f,
  @location(1) bright: vec4f,
}

@fragment
fn fs(fragData: VertexOut) -> FragmentOut
{
  var out: FragmentOut;

  out.color = fragData.color;
  out.bright = vec4(0.0, 0.0, 0.0, 1.0);

  return out;
}
`
