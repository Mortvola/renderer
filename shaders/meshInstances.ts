export const meshInstances = /*wgsl*/`
struct InstanceInfo {
  color: vec4f,
  id: f32,
}

@group(1) @binding(0) var<uniform> modelMatrix: array<mat4x4f, 1000>;
@group(1) @binding(1) var<uniform> instanceInfo: array<InstanceInfo, 1000>;
@group(1) @binding(2) var<uniform> inverseModelMatrix: array<mat4x4f, 1000>;
`
