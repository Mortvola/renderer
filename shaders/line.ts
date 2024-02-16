import { common } from "./common";
import { meshInstances } from "./meshInstances";

export const lineShader = /*wgsl*/`
struct Vertex {
  @location(0) position: vec4f,
  @location(1) color: vec4f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

${common}

${meshInstances}

@vertex
fn vertex_line(vert: Vertex) -> VertexOut
{
  var output : VertexOut;

  output.position = projectionMatrix * viewMatrix * vert.position;
  output.color = vert.color;
  return output;
}

struct FragmentOut {
  @location(0) color: vec4f,
  @location(1) bright: vec4f,
}

@fragment
fn fragment_line(fragData: VertexOut) -> FragmentOut
{
  var out: FragmentOut;

  out.color = fragData.color;
  out.bright = vec4(0.0, 0.0, 0.0, 1.0);

  return out;
}
`
