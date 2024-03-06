export const meshInstances = /*wgsl*/`
@group(1) @binding(0) var<uniform> modelMatrix: array<mat4x4f, 1000>;
@group(1) @binding(1) var<uniform> instanceColor: array<vec4f, 1000>;
`
