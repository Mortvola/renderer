import { common } from "./common";
import { texturedFragment } from "./texturedFragment";

export const reticleShader = /*wgsl*/`
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) texcoord: vec2f,
}

${common}

@group(3) @binding(0) var<uniform> radius: f32;

@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VertexOut
{
  let verts = array(
    vec2f(-1.0, 1.0),
    vec2f(-1.0, -1.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, 1.0),
    vec2f(-1.0, -1.0),
    vec2f(1.0, -1.0),
  );

  var output : VertexOut;

  output.position = vec4(
    verts[vertexIndex].x * radius,
    verts[vertexIndex].y * radius * aspectRatio,
    0,
    1
  );

  output.texcoord = (verts[vertexIndex] + 1.0) / 2;

  return output;
}

${texturedFragment}
`
