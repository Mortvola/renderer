export const outlineApllyShader = /*wgsl*/`
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
@group(0) @binding(1) var outlineTexture: texture_2d<f32>;

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  var textureStep = 1.0 / vec2f(textureDimensions(outlineTexture));

  var center = textureSample(outlineTexture, ourSampler, vertexOut.texcoord).r;

  var value =
    distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(1.0, 0.0) * textureStep).r)
    + distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(-1.0, 0.0) * textureStep).r)
    + distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(0.0, 1.0) * textureStep).r)
    + distance(center, textureSample(outlineTexture, ourSampler, vertexOut.texcoord + vec2f(0.0, -1.0) * textureStep).r);

  return vec4f(value, value, 0, value);
}
`
