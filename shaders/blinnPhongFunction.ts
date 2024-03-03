export const phongFunction = /*wgsl*/`
struct Lighting {
  diffuse: vec3f,
  specular: vec3f,
}

fn blinnPhong(
  viewDirection: vec3f, // assumed to be normalied
  normal: vec3f, // assumed to be normalized
  lightDirection: vec3f,  // assumed to be normalized
  lightColor: vec3f,
  attenuation: f32,
) -> Lighting
{
  var output: Lighting;

  var specularStrength = 0.5;
  var shininess = 2.0;

  var NdotL = dot(normal, lightDirection);
  output.diffuse = max(NdotL, 0) * lightColor * attenuation;

  output.specular = vec3f(0);
  if (NdotL >= -0.1) {
    var halfwayDir = normalize(viewDirection + lightDirection);
    var NdotH = dot(normal, halfwayDir);
    output.specular = specularStrength * pow(max(NdotH, 0), shininess) * lightColor * attenuation;
  }

  return output;
}
`
