import { runInAction } from "mobx";
import { GraphEdgeInterface, InputPortInterface, OutputPortInterface } from "./Types";

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

  getVarName(): string {
    return this.output.getVarName() ?? '';
  }

  setVarName(name: string | null): void {
    this.output.node.setVarName(name);
  }

  getValue(): string {
    return this.output.getValue() ?? '';
  }
}

export default GraphEdge;

