import { textureAttributes } from "./textureAttributes";

export const texturedFragment = /*wgsl*/`
${textureAttributes}

@group(2) @binding(1) var ourSampler: sampler;
@group(2) @binding(2) var ourTexture: texture_2d<f32>;
@group(2) @binding(3) var<uniform> texAttr: TextureAttributes;

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  var offset = vec2f(0, time);

  return textureSample(ourTexture, ourSampler, fract(vertexOut.texcoord * texAttr.scale + offset));
}
`
