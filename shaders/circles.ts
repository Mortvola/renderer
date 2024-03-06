export const circles = /*wgsl*/`
struct Circle {
  position: vec4f,
  color: vec4f,
  radius: f32,
  thickness: f32,
}

struct Circles {
  numCircles: u32,
  circles: array<Circle, 128>,
}
`
