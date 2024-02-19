import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class Clamp extends OperationNode {
  constructor(id?: number) {
    super('Clamp', 'Clamp', id)

    this.inputPorts = [
      new InputPort(this, 'vec4f', 'A'),
      new InputPort(this, 'vec4f', 'B'),
      new InputPort(this, 'vec4f', 'C'),
    ];

    this.outputPort = [new OutputPort(this, 'vec4f', 'result')]
  }

  getExpression(): [string, DataType] {
    const [varA, dataTypeA] = this.inputPorts[0].getValue();
    const [varB] = this.inputPorts[1].getValue();
    const [varC] = this.inputPorts[2].getValue();

    return [`clamp(${varA}, ${varB}, ${varC})`, dataTypeA];
  }
}

export default Clamp;
