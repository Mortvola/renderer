export const getFragmentStage = (body: string, bloom: boolean): string => {
  return `
    ${
      bloom ?
        `
        struct FragmentOut {
          @location(0) color: vec4f,
          @location(1) bright: vec4f,
        }        
        `
        : ''
    }

    @fragment
    fn fs(vertexOut: VertexOut) -> ${ bloom ? 'FragmentOut' : '@location(0) vec4f' }
    {
      ${
        body
          ? body
          : 'var fragOut = vertexOut.color;'
      }

      ${
        bloom
          ? (
            `
            var out: FragmentOut;

            out.color = fragOut;

            // Compute relative luminance (coefficients from https://www.w3.org/TR/AERT/#color-contrast
            var luminance = dot(out.color.rgb, vec3f(0.299, 0.587, 0.114));
          
            if (luminance > 1.0) {
              out.bright = out.color;
            }
            else {
              out.bright = vec4(0.0, 0.0, 0.0, 1.0);
            }
          
            return out;          
            `
          )
          : 'return fragOut;'
      }
    }
  `
}
