import { textureAttributes } from "./textureAttributes";

export const texturedFragment = /*wgsl*/`
${textureAttributes}

@group(2) @binding(1) var ourSampler: sampler;
@group(2) @binding(2) var ourTexture: texture_2d<f32>;
@group(2) @binding(3) var<uniform> texAttr: TextureAttributes;

struct FragmentOut {
  @location(0) color: vec4f,
  @location(1) bright: vec4f,
}

@fragment
fn fs(vertexOut: VertexOut) -> FragmentOut
{
  var color = textureSample(ourTexture, ourSampler, vertexOut.texcoord);

  var out: FragmentOut;

  out.color = color;
  out.bright = vec4(0.0, 0.0, 0.0, 1.0);

  return out;
}
`
