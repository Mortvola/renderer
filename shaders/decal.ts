import { common } from "./common";
import { meshInstances } from "./meshInstances";

export const decalShader = /*wgsl*/`
${common}

${meshInstances}

struct Vertex {
  @location(0) position: vec4f,
}

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(flat) instanceIndex: u32,
}

@vertex
fn vs(
  @builtin(instance_index) instanceIndex: u32,
  vert: Vertex,
) -> VertexOut
{
  var out: VertexOut;

  out.position = projectionMatrix * viewMatrix * modelMatrix[instanceIndex] * vert.position;
  out.instanceIndex = instanceIndex;

  return out;
}

@group(2) @binding(0) var textureSampler: sampler;
@group(2) @binding(1) var texture: texture_2d<f32>;

@group(3) @binding(0) var positionSampler: sampler;
@group(3) @binding(1) var positionTexture: texture_2d<f32>;

@fragment
fn fs(vertexOut: VertexOut) -> @location(0) vec4f
{
  // vertexOut.position.xy is the position on the screen
  // Determine the position in the position texture and retrieve it.
  var texturePos = vertexOut.position.xy / vec2f(textureDimensions(positionTexture));
  var position = textureSample(positionTexture, positionSampler, texturePos);

  var id = position.w;
  position.w = 1.0;

  // Transform the position into the model space of the decal projector.
  // Add 0.5 to the x and y to get the uv texture position.
  var wp = (inverseModelMatrix[vertexOut.instanceIndex] * inverseViewMatrix * position).xz + vec2f(0.5, 0.5);
  var color = textureSample(texture, textureSampler, wp);

  // If the texture position is outside the range 0.0 to 1.0 then discard the texture color.
  if (
    id != 0.0
    || wp.x < 0.0 || wp.x >= 1.0
    || wp.y < 0.0 || wp.y >= 1.0
  ) {
    // color = vec4f(0, 0, 0, 0);
    discard;
  }

  return color;
}
`
