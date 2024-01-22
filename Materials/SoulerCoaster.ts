import { MaterialDescriptor } from "./MaterialDescriptor";

export const soulerCoasterMaterial: MaterialDescriptor = {
  type: 'Lit',

  cullMode: 'none',

  graph: {
    vertex: {
      nodes: [],
      edges: [],
    },

    fragment: {
      nodes: [
        { id: 0, type: 'property', name: 'test', x: 0, y: 0 },
        { id: 3, type: 'uv', x: 0, y: 0 },
        { id: 1, type: 'SampleTexture', x: 0, y: 0 },
        { id: 2, type: 'display', x: 0, y: 0 },
        { id: 4, type: 'TileAndScroll', x: 0, y: 0 },
        { id: 5, type: 'property', name: 'tile', x: 0, y: 0 },
        { id: 6, type: 'property', name: 'scroll', x: 0, y: 0 },
        { id: 7, type: 'Multiply', x: 0, y: 0 },
        { id: 8, type: 'time', x: 0, y: 0 },
      ],

      edges: [
        [{ id: 3, port: 'uv'  }, { id: 4, port: 'uv' }],
        [{ id: 5, port: 'tile'}, { id: 4, port: 'tile' }],
        [{ id: 6, port: 'scroll'}, { id: 7, port: 'A' }],
        [{ id: 8, port: 'time'}, { id: 7, port: 'B' }],
        [{ id: 7, port: 'result'}, { id: 4, port: 'scroll' }],
        [{ id: 4, port: 'result'}, { id: 1, port: 'uv' }],
        [{ id: 1, port: 'sample' }, { id: 2, port: 'fragment' }],
        [{ id: 0, port: ''  }, { id: 1, port: 'texture' }],
      ]
    }
  }
}
