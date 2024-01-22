import { common } from './common';
import { lights } from './lights';
import { phongFragment } from './phongFragment';

export const litShader = /*wgsl*/`
struct Vertex {
  @location(0) position: vec4f,
  @location(1) normal: vec4f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) fragPos: vec4f,
  @location(2) normal: vec4f,
}

${common}

@group(2) @binding(0) var<uniform> color: array<vec4f, 16>;

@vertex
fn vs(
  @builtin(instance_index) instanceIndex: u32,
  vert: Vertex,
) -> VertexOut
{
  var output: VertexOut;

  output.position = projectionMatrix * viewMatrix * modelMatrix[instanceIndex] * vert.position;

  output.color = color[0];
  output.fragPos = viewMatrix * modelMatrix[0] * vert.position;
  output.normal = viewMatrix * modelMatrix[0] * vert.normal;

  return output;
}

${phongFragment}
`
