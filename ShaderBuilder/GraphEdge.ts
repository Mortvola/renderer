import { runInAction } from "mobx";
import { DataType, GraphEdgeInterface, InputPortInterface, OutputPortInterface } from "./Types";

class GraphEdge implements GraphEdgeInterface {
  output: OutputPortInterface;

  input: InputPortInterface;

  constructor(outputPort: OutputPortInterface, inputPort: InputPortInterface) {
    this.output = outputPort;

    this.input = inputPort;

    runInAction(() => {
      outputPort.edges.push(this);
      inputPort.edge = this;
    })
  }

  getDataType(): DataType {
    return this.output.getDataType()
  }

  getVarName(): [string, DataType] {
    return this.output.getVarName() ?? ['', 'float'];
  }

  setVarName(name: string | null): void {
    this.output.node.setVarName(name);
  }

  getValue(): [string, DataType] {
    return this.output.getValue() ?? ['', 'float'];
  }
}

export default GraphEdge;

