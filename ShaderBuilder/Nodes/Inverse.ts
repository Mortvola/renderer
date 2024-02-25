import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class Inverse extends OperationNode {
  constructor(id?: number) {
    super('Inverse', 'Inverse', id)

    this.inputPorts = [
      new InputPort(this, 'vec2f', 'Value'),
    ];

    this.outputPort = [new OutputPort(this, 'vec2f', 'result')]
  }

  getDataType(): DataType {
    return this.inputPorts[0].getDataType()
  }

  getExpression(): [string, DataType] {
    const [varA, dataTypeA] = this.inputPorts[0].getValue();

    return [`1 / (${varA})`, dataTypeA];
  }
}

export default Inverse;
