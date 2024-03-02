import { common } from "./common";
import { fullscreenVertexStage } from "./fullscreenVertexStage";
import { phongFunction } from "./phongFunction";

export const deferredCombine = /*wgsl*/`
${common}

${fullscreenVertexStage}

${phongFunction}

@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var albedoTexture: texture_2d<f32>;
@group(1) @binding(2) var positionTexture: texture_2d<f32>;
@group(1) @binding(3) var normalTexture: texture_2d<f32>;

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  var albedo = textureSample(albedoTexture, textureSampler, vertexOut.texcoord);
  var position = textureSample(positionTexture, textureSampler, vertexOut.texcoord);
  var normal = textureSample(normalTexture, textureSampler, vertexOut.texcoord);

  return vec4(phong(position, normal, albedo).rgb, 1.0);
}
`
