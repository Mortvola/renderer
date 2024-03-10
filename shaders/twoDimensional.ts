export const twoDimensional = /*wgsl*/`
struct Dimensions {
  x: f32,
  y: f32,
  width: f32,
  height: f32,
}

@group(1) @binding(0) var<uniform> dimensions: array<Dimensions, 1000>;
@group(1) @binding(1) var<uniform> instanceColor: array<vec4f, 1000>;
`
