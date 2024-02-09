import { makeObservable, observable } from "mobx";
import { DataType, GraphEdgeInterface, GraphNodeInterface, OutputPortInterface } from "../Types"
import Port from "./Port";

class OutputPort extends Port implements OutputPortInterface {
  edges: GraphEdgeInterface[] = [];

  constructor(node: GraphNodeInterface, dataType: DataType, name: string) {
    super(node, dataType, name);

    makeObservable(this, {
      edges: observable,
    })
  }

  getDataType(): DataType {
    return this.node.getDataType()
  }

  getVarName(): [string, DataType] {
    return this.node.getVarName() ?? ['', this.dataType];
  }

  getValue(): [string, DataType] {
    return this.node.getValue() ?? ['', this.dataType];
  }
}

export default OutputPort;

