import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class Step extends OperationNode {
  constructor(id?: number) {
    super('Step', 'Step', id)

    this.inputPorts = [
      new InputPort(this, 'vec4f', 'A'),
      new InputPort(this, 'float', 'B'),
    ];

    this.outputPort = [new OutputPort(this, 'vec4f', 'result')]
  }

  getExpression(): [string, DataType] {
    const [varA, dataTypeA] = this.inputPorts[0].getValue();
    const [varB] = this.inputPorts[1].getValue();

    return [`step(${varA}, ${varB})`, dataTypeA];
  }
}

export default Step;
