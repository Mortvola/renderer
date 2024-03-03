import { lights } from "./lights";

export const common = /*wgsl*/`
${lights}

@group(0) @binding(0) var<uniform> projectionMatrix: mat4x4f;
@group(0) @binding(1) var<uniform> viewMatrix: mat4x4f;
@group(0) @binding(2) var<uniform> cameraPos: vec4f;
@group(0) @binding(3) var<uniform> aspectRatio: f32;
@group(0) @binding(4) var<storage> lights: Lights;
@group(0) @binding(5) var<uniform> time: f32;
`
