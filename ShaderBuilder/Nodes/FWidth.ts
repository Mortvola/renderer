import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class FWidth extends OperationNode {
  constructor(id?: number) {
    super('FWidth', 'FWidth', id)

    this.inputPorts = [
      new InputPort(this, 'vec2f', 'input'),
    ];

    this.outputPort = [new OutputPort(this, 'vec2f', 'result')]
  }

  getExpression(): [string, DataType] {
    const [value, dataType] = this.inputPorts[0].getValue();

    return [`fwidth(${value})`, dataType];
  }
}

export default FWidth;
