export const blurShader = /*wgsl*/`
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) texcoord: vec2f,
}

@vertex
fn vs(
  @builtin(vertex_index) vertexIndex : u32,
) -> VertexOut
{
  let verts = array(
    vec4f(-1.0, 1.0, 0, 1),
    vec4f(-1.0, -3.0, 0, 1),
    vec4f(3.0, 1.0, 0, 1),
  );

  let texcoords = array(
    vec2f(0.0, 0.0),
    vec2f(0.0, 2.0),
    vec2f(2.0, 0.0),
  );

  var output : VertexOut;

  output.position = verts[vertexIndex];
  output.texcoord = texcoords[vertexIndex];

  return output;
}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;

var<private> weights: array<f32, 5> = array(
  0.204163688,
  0.180173822,
  0.123831536,
  0.066282245,
  0.027630550,

  // 0.1,
  // 0.2,
  // 0.2,
  // 0.2,
  // 0.3,
);

@fragment
fn horizontalPass(vertexOut: VertexOut) -> @location(0) vec4f
{
  var result = textureSample(ourTexture, ourSampler, vertexOut.texcoord) * weights[0];

  var textureStep = 1.0 / f32(textureDimensions(ourTexture).x);

  for (var i = 1; i < 5; i++) {
    var offset = vec2f(textureStep * f32(i), 0.0);

    result += textureSample(ourTexture, ourSampler, vertexOut.texcoord + offset) * weights[i];
    result += textureSample(ourTexture, ourSampler, vertexOut.texcoord - offset) * weights[i];
  }

  return vec4f(result.rgb, 1.0);
}

@fragment
fn verticalPass(vertexOut: VertexOut) -> @location(0) vec4f
{
  var result = textureSample(ourTexture, ourSampler, vertexOut.texcoord) * weights[0];

  var textureStep = 1.0 / f32(textureDimensions(ourTexture).y);

  for (var i = 1; i < 5; i++) {
    var offset = vec2f(0.0, textureStep * f32(i));

    result += textureSample(ourTexture, ourSampler, vertexOut.texcoord + offset) * weights[i];
    result += textureSample(ourTexture, ourSampler, vertexOut.texcoord - offset) * weights[i];
  }

  return vec4f(result.rgb, 1.0);
}
`
