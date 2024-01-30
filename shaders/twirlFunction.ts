export const twirlFunction = /*wgsl*/`
fn twirl(uv: vec2f, strength: f32, offset: vec2f) -> vec2f
{
  var point = uv - vec2f(0.5, 0.5);
  var angle = strength * length(point);

  // Rotate point
  return vec2f(
    point.x * cos(angle) - point.y * sin(angle) + 0.5 + offset.x,
    point.y * cos(angle) + point.x * sin(angle) + 0.5 + offset.y,  
  );
}
`
