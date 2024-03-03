import { common } from "./common";
import { fullscreenVertexStage } from "./fullscreenVertexStage";
import { phongFunction } from "./blinnPhongFunction";

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
  var albedo = textureSample(albedoTexture, textureSampler, vertexOut.texcoord).rgb;
  var position = textureSample(positionTexture, textureSampler, vertexOut.texcoord).xyz;
  var normal = textureSample(normalTexture, textureSampler, vertexOut.texcoord).xyz;

  var ambientColor = vec3f(1.0, 1.0, 1.0);
  var ambientStrength = f32(0.1);
  var lightColor = pointLights.directionalColor.rgb;
  var lightDirection = pointLights.directional.xyz;

  var lighting = blinnPhong(position, normal, albedo, lightColor, lightDirection);

  return vec4(ambientStrength * ambientColor * albedo + lighting, 1.0);
}
`
