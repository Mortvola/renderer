import { fullscreenVertexStage } from "./fullscreenVertexStage";

export const bloomShader = /*wgsl*/`
${fullscreenVertexStage}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var screenTexture: texture_2d<f32>;

@group(1) @binding(0) var bloomSampler: sampler;
@group(1) @binding(1) var bloomTexture: texture_2d<f32>;

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  var screenSample = textureSample(screenTexture, ourSampler, vertexOut.texcoord).rgb;
  var bloomSample = textureSample(bloomTexture, bloomSampler, vertexOut.texcoord).rgb;

  // screenSample *= (vec3f(1.0) - clamp(bloomSample, vec3f(0.0), vec3f(1.0)));

  // var outColor = screenSample + bloomSample;
  var outColor = screenSample + bloomSample;

  // var exposure = 1.5;
  // var mapped = vec3f(1.0) - exp(-outColor * exposure);
  // // outColor / (outColor + vec3f(1.0));
  // return vec4f(mapped, 1.0);

  return vec4f(outColor, 1.0);
  // return vec4f(bloomSample, 1.0);
  // return vec4f(screenSample, 1.0);
}
`
