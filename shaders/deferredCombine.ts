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
@group(1) @binding(4) var decalTexture: texture_2d<f32>;

fn lighting(albedo: vec3f, position: vec3f, normal: vec3f) -> vec3f
{
  var ambientColor = vec3f(1.0, 1.0, 1.0);
  var ambientStrength = f32(0.25);

  var viewDir = normalize(-position);

  var lighting: Lighting;
  lighting.diffuse = vec3f(0.0);
  lighting.specular = vec3f(0.0);

  for (var i: u32; i < lights.numDirectional; i++) {
    var light = lights.directional[i];

    var lightColor = light.color.rgb;
    var lightDirection = normalize(light.direction.xyz);
  
    var result = blinnPhong(viewDir, normal, lightDirection, lightColor, 1.0);

    lighting.diffuse += result.diffuse;
    lighting.specular += result.specular;
  }

  for (var i: u32 = 0; i < lights.numPointLights; i++) {
    var pointLight = lights.pointLights[i];\

    var lightColor = pointLight.color.rgb;
    var lightDirection = normalize(pointLight.position.xyz - position);

    var distance = distance(pointLight.position.xyz, position);
    var attenuation = 1.0 / (pointLight.attConstant + pointLight.attLinear * distance + pointLight.attQuadratic * distance * distance);

    var result = blinnPhong(viewDir, normal, lightDirection, lightColor, attenuation);

    lighting.diffuse += result.diffuse;
    lighting.specular += result.specular;
  }

  return (ambientStrength * ambientColor + lighting.diffuse + lighting.specular) * albedo;
}

fn rangeCircles(wp: vec4f, albedo: vec3f) -> vec3f {
  for (var i: u32 = 0; i < circles.numCircles; i++) {
    var circle = circles.circles[i];
    
    var d = distance(wp.xz, circle.position.xz);

    if (d >= circle.radius && d < circle.radius + circle.thickness) {
      return circle.color.rgb;
    }
  }

  return albedo;
}

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  var albedo = textureSample(albedoTexture, textureSampler, vertexOut.texcoord).rgb;
  var position = textureSample(positionTexture, textureSampler, vertexOut.texcoord);
  var normal = normalize(textureSample(normalTexture, textureSampler, vertexOut.texcoord).xyz);
  var decal = textureSample(decalTexture, textureSampler, vertexOut.texcoord);

  var id = position.w;
  position.w = 1;

  var wp = inverseViewMatrix * position;

  albedo = mix(albedo, decal.rgb, decal.aaa);

  albedo = lighting(albedo, position.xyz, normal);

  if (id == 0.0) {
    albedo = rangeCircles(wp, albedo);
  }

  return vec4f(albedo, 1.0);
}
`
