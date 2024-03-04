import { circles } from "./circles";
import { lights } from "./lights";

export const common = /*wgsl*/`
${lights}
${circles}

@group(0) @binding(0) var<uniform> projectionMatrix: mat4x4f;
@group(0) @binding(1) var<uniform> viewMatrix: mat4x4f;
@group(0) @binding(2) var<uniform> inverseViewMatrix: mat4x4f;
@group(0) @binding(3) var<uniform> cameraPos: vec4f;
@group(0) @binding(4) var<uniform> aspectRatio: f32;
@group(0) @binding(5) var<storage> lights: Lights;
@group(0) @binding(6) var<storage> circles: Circles;
@group(0) @binding(7) var<uniform> time: f32;
`
