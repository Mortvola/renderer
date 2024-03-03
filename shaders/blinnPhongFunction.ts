export const phongFunction = /*wgsl*/`
fn blinnPhong(fragPos: vec4f, normal: vec4f, color: vec3f) -> vec3f
{
  var ambientStrength = f32(0.1);
  var specularStrength = 0.5;
  var shininess = 64.0;

  var normal2 = normalize(normal);
  var viewDir = normalize(-fragPos);

  // var lightColor = pointLights.lights[0].color;
  var lightColor = pointLights.directionalColor.rgb;
  // var lightDir = normalize(pointLights.lights[0].position - fragPos);
  var lightDir = normalize(pointLights.directional);
  var halfwayDir = normalize(viewDir + lightDir);
  var reflectDir = reflect(-lightDir, normal2);

  var diffuse = max(dot(normal2, lightDir), 0.0);
  var specular = specularStrength * pow(max(dot(normal2, halfwayDir), 0.0), shininess);

  return (ambientStrength + diffuse + specular) * lightColor * color;
}
`
