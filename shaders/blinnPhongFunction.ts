export const phongFunction = /*wgsl*/`
fn blinnPhong(
  fragPos: vec3f,
  normal: vec3f,
  color: vec3f,
  lightColor: vec3f,
  lightDirection: vec3f,
) -> vec3f
{
  var specularStrength = 0.5;
  var shininess = 64.0;

  var normal2 = normalize(normal);
  var viewDir = normalize(-fragPos);

  // var lightColor = pointLights.lights[0].color;
  // var lightColor = pointLights.directionalColor.rgb;
  // var lightDir = normalize(pointLights.lights[0].position - fragPos);
  var lightDir = normalize(lightDirection);
  var halfwayDir = normalize(viewDir + lightDir);

  var diffuse = max(dot(normal2, lightDir), 0.0);
  var specular = specularStrength * pow(max(dot(normal2, halfwayDir), 0.0), shininess);

  return (diffuse + specular) * lightColor * color;
}
`
