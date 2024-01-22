import { NodeType, ValueType, DataType } from "./Types";

export type GraphPortDescriptor = { id: number, port: string };

export type GraphEdgeDescriptor = [GraphPortDescriptor, GraphPortDescriptor];

export type PortValueDescriptor = {
  port: string,
  value: ValueType,
}

export type GraphNodeDescriptor = {
  x?: number,
  y?: number,
  id: number,
  type: NodeType,
  portValues?: PortValueDescriptor[], 
}

export type PropertyDescriptor = GraphNodeDescriptor & {
  name: string,
}

export type ValueDescriptor = GraphNodeDescriptor & {
  dataType: DataType,
  value: ValueType,
}

export type GraphStageDescriptor = {
  nodes: (GraphNodeDescriptor | PropertyDescriptor | ValueDescriptor)[],
  edges: GraphEdgeDescriptor[],
}

export type GraphDescriptor = {
  vertex: GraphStageDescriptor,
  fragment: GraphStageDescriptor,
}
