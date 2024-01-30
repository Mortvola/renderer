export const voronoiFunction = /*wgsl*/`
fn rand2dTo1d(value: vec2f, dotDir: vec2f) -> f32 {
  var smallValue = sin(value);
  var random = dot(smallValue, dotDir);
  random = fract(sin(random) * 143758.5453);
  return random;
}

fn rand2dTo2d(value: vec2f) -> vec2f {
  return vec2f(
    rand2dTo1d(value, vec2f(12.989, 78.233)),
    rand2dTo1d(value, vec2f(39.346, 11.135))
  );
}

fn voronoi(uv: vec2f, density: f32) -> f32
{
  var baseCell = floor(uv * density);
  var minDistToCell = 10.0;

  for(var x: i32 = -1; x <= 1; x++) {
    for(var y: i32 = -1; y <= 1; y++) {
      var cell = baseCell + vec2f(f32(x), f32(y));
      var cellPosition = cell + rand2dTo2d(cell);
      var distToCell = distance(cellPosition, uv * density);

      if(distToCell < minDistToCell) {
        minDistToCell = distToCell;
      }
    }
  }

  return minDistToCell;
}
`