import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class Lerp extends OperationNode {
  constructor(id?: number) {
    super('Lerp', 'Lerp', id)

    this.inputPorts = [
      new InputPort(this, 'vec4f', 'A'),
      new InputPort(this, 'vec4f', 'B'),
      new InputPort(this, 'vec4f', 'T'),
    ];

    this.outputPort = [new OutputPort(this, 'vec4f', 'result')]
  }

  getExpression(): [string, DataType] {
    const [varA, dataTypeA] = this.inputPorts[0].getValue();
    const [varB] = this.inputPorts[1].getValue();
    const [varT] = this.inputPorts[2].getValue();

    return [`mix(${varA}, ${varB}, ${varT})`, dataTypeA];
  }
}

export default Lerp;
