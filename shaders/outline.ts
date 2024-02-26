import { common } from "./common";
import { meshInstances } from "./meshInstances";

export const outlineShader = /*wgsl*/`
struct Vertex {
  @location(0) position: vec4f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
}

${common}

${meshInstances}

@vertex
fn vs(
  @builtin(instance_index) instanceIndex: u32,
  vert: Vertex,
) -> VertexOut
{
  var output: VertexOut;

  output.position = projectionMatrix * viewMatrix * modelMatrix[instanceIndex] * vert.position;

  return output;
}

@fragment
fn fs(fragData: VertexOut) -> @location(0) vec4f
{
  return vec4f(1.0, 1.0, 1.0, 1.0);
}
`
