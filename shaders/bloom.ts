export const bloomShader = /*wgsl*/`
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
@group(0) @binding(1) var screenTexture: texture_2d<f32>;

@group(1) @binding(0) var bloomSampler: sampler;
@group(1) @binding(1) var bloomTexture: texture_2d<f32>;

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  var screenSample = textureSample(screenTexture, ourSampler, vertexOut.texcoord).rgb;
  var bloomSample = textureSample(bloomTexture, bloomSampler, vertexOut.texcoord).rgb;

  // screenSample *= (vec3f(1.0) - clamp(bloomSample, vec3f(0.0), vec3f(1.0)));

  // var outColor = screenSample + bloomSample;
  var outColor = screenSample + bloomSample;

  // var exposure = 1.5;
  // var mapped = vec3f(1.0) - exp(-outColor * exposure);
  // // outColor / (outColor + vec3f(1.0));
  // return vec4f(mapped, 1.0);

  return vec4f(outColor, 1.0);
  // return vec4f(bloomSample, 1.0);
  // return vec4f(screenSample, 1.0);
}
`
