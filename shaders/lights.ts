export const lights = /*wgsl*/`
struct DirectionalLight {
  direction: vec4f,
  color: vec4f,
}

struct PointLight {
  position: vec4f,
  color: vec4f,
  attConstant: f32,
  attLinear: f32,
  attQuadratic: f32,
}

struct Lights {
  numDirectional: u32,
  directional: array<DirectionalLight, 4>,
  numPointLights: u32,
  pointLights: array<PointLight, 16>,
}
`
