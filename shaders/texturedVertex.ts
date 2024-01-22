export const texturedVertex = /*wgsl*/`
@vertex
fn vs(
  @builtin(instance_index) instanceIndex: u32,
  vert: Vertex,
) -> VertexOut
{
  var output: VertexOut;

  output.position = projectionMatrix * viewMatrix * modelMatrix[instanceIndex] * vert.position;
  output.texcoord = vert.texcoord;

  return output;
}
`