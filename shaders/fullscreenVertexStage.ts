export const fullscreenVertexStage = /*wgsl*/`
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) texcoord: vec2f,
}

@vertex
fn vs(
  @builtin(vertex_index) vertexIndex : u32,
) -> VertexOut
{
  let verts = array(
    vec4f(-1.0, 1.0, 0, 1),
    vec4f(-1.0, -3.0, 0, 1),
    vec4f(3.0, 1.0, 0, 1),
  );

  let texcoords = array(
    vec2f(0.0, 0.0),
    vec2f(0.0, 2.0),
    vec2f(2.0, 0.0),
  );

  var output : VertexOut;

  output.position = verts[vertexIndex];
  output.texcoord = texcoords[vertexIndex];

  return output;
}
`