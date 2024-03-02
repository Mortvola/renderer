export const phongFunction = /*wgsl*/`
fn phong(fragPos: vec4f, normal: vec4f, color: vec4f) -> vec4f
{
  var ambientStrength = f32(0.1);
  var specularStrength = 0.5;
  var shininess = 32.0;

  var normal2 = normalize(normal);
  var viewDir = normalize(-fragPos);

  // var lightColor = pointLights.lights[0].color;
  var lightColor = pointLights.directionalColor;
  // var lightDir = normalize(pointLights.lights[0].position - fragPos);
  var lightDir = normalize(pointLights.directional);
  var reflectDir = reflect(-lightDir, normal2);

  var diffuse = max(dot(normal2, lightDir), 0.0);
  var specular = specularStrength * pow(max(dot(viewDir, reflectDir), 0.0), shininess);

  return (ambientStrength + diffuse + specular) * lightColor * color;
}
`
