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

  var halfwayDir = normalize(viewDirection + lightDirection);
  var NdotH = dot(normal, halfwayDir);
  // The step call is to eliminate specular (without using branching) if the surface is facing away from the light
  // (The -0.1 is a fudge factor to reduce fighting).
  output.specular = step(-0.1, NdotL) * specularStrength * pow(max(NdotH, 0), shininess) * lightColor * attenuation;

  return output;
}
`
