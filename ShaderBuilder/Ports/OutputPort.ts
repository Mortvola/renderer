import { makeObservable, observable } from "mobx";
import { DataType, GraphEdgeInterface, GraphNodeInterface, OutputPortInterface } from "../Types"
import Port from "./Port";

class OutputPort extends Port implements OutputPortInterface {
  edges: GraphEdgeInterface[] = [];

  constructor(node: GraphNodeInterface, dataYype: DataType, name: string) {
    super(node, dataYype, name);

    makeObservable(this, {
      edges: observable,
    })
  }

  getVarName(): string {
    return this.node.getVarName() ?? '';
  }

  getValue(): string {
    return this.node.getValue() ?? '';
  }
}

export default OutputPort;

