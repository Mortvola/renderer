import { fullscreenVertexStage } from "./fullscreenVertexStage";

export const outlineApplyShader = /*wgsl*/`
${fullscreenVertexStage}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var outlineTexture: texture_2d<f32>;

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  var textureStep = 1.0 / vec2f(textureDimensions(outlineTexture));

  var center = textureSample(outlineTexture, ourSampler, vertexOut.texcoord).r;

  var value =
    distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(1.0, 0.0) * textureStep).r)
    + distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(-1.0, 0.0) * textureStep).r)
    + distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(0.0, 1.0) * textureStep).r)
    + distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(0.0, -1.0) * textureStep).r);

  return vec4f(value, value, 0, value);
}
`
