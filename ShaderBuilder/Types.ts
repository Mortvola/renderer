export type DataType = 'float' | 'vec2f' | 'vec3f' | 'vec4f' | 'texture2D' | 'sampler' | 'rgba' | 'string' | 'uv';

export type NodeType =
  'property' | 'value'
  | 'uv' | 'time'  | 'time'
  | 'Add' | 'display' | 'Fraction' | 'Multiply' | 'SampleTexture' | 'TileAndScroll'
  | 'PhongShading';

export type SamplerDescriptor = {};

export type ValueType =
  string
  | number 
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | SamplerDescriptor;

export interface PortInterface {
  node: GraphNodeInterface;

  dataType: DataType;

  name: string;

  offsetX: number;

  offsetY: number;
}

export interface InputPortInterface extends PortInterface {
  edge: GraphEdgeInterface | null;

  value?: ValueInterface;

  getVarName(): string;

  getValue(): string;
};

export const isInputPort = (r: unknown): r is InputPortInterface => (
  (r as InputPortInterface).edge !== undefined
)

export interface OutputPortInterface extends PortInterface {
  edges: GraphEdgeInterface[];
  
  getVarName(): string;

  getValue(): string;
};

export interface GraphNodeInterface {
  type: NodeType;

  id: number;

  inputPorts: InputPortInterface[];

  outputPort: OutputPortInterface[];

  getVarName(): string | null;

  setVarName(name: string | null): void;

  getValue(): string;

  position: { x: number, y: number };

  priority: number | null;

  getName(): string;

  output(): string;

  setPosition(x: number, y: number): void;
}

export interface PropertyNodeInterface extends GraphNodeInterface {
  property: PropertyInterface;

  outputPort: OutputPortInterface[];

  readonly: boolean;
}

export interface ValueNodeInterface extends GraphNodeInterface {
  value: ValueInterface;
}

export const isPropertyNode = (r: unknown): r is PropertyNodeInterface => (
  (r as PropertyNodeInterface).property !== undefined
)

export const isValueNode = (r: unknown): r is ValueNodeInterface => (
  (r as ValueNodeInterface).value !== undefined
)

export interface GraphEdgeInterface {  
  output: OutputPortInterface;

  input: InputPortInterface;

  getVarName(): string;

  setVarName(name: string): void;

  getValue(): string;
}

export interface ValueInterface {
  dataType: DataType;

  value: ValueType;

  getValueString(): string;
}

export interface PropertyInterface {
  name: string;

  value: ValueInterface;

  builtin: boolean;
}

export const getLength = (dataType: DataType) => {
  switch (dataType) {
    case 'float':
      return 1;
    case 'vec2f':
      return 2;
    case 'vec3f':
      return 3;
    case 'vec4f':
      return 4;
  }

  return 0;
}
