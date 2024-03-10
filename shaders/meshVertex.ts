export const getMeshVertex = (lit: boolean) => (
  /*wgsl*/`
struct Vertex {
  @location(0) position: vec4f,
  @location(1) normal: vec4f,
  @location(2) texcoord: vec2f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f,
  @location(1) texcoord: vec2f,
  @location(2) @interpolate(flat) id: f32,
  ${lit ? '@location(3) fragPos: vec4f,\n@location(4) normal: vec4f,' : ''}    
}
    
@vertex
fn vs(
  @builtin(instance_index) instanceIndex: u32,
  vert: Vertex,
) -> VertexOut
{
  var output: VertexOut;

  output.position = projectionMatrix * viewMatrix * modelMatrix[instanceIndex] * vert.position;
  output.color = instanceInfo[instanceIndex].color;
  output.texcoord = vert.texcoord;
  output.id = instanceInfo[instanceIndex].id;

  ${lit
    ? `
    output.fragPos = viewMatrix * modelMatrix[instanceIndex] * vert.position;
    output.normal = viewMatrix * modelMatrix[instanceIndex] * vert.normal;          
    `
    : ''
  }

  return output;
}
`
)