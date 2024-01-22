export const texturedCommon = /*wgsl*/`
struct Vertex {
  @location(0) position: vec4f,
  @location(1) normal: vec4f,
  @location(2) texcoord: vec2f,
}

struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) texcoord: vec2f,
}
`