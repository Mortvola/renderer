import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class Fraction extends OperationNode {
  constructor(id?: number) {
    super('Fraction', 'Fraction', id)

    this.inputPorts = [
      new InputPort(this, 'vec2f', 'input'),
    ];

    this.outputPort = [new OutputPort(this, 'vec2f', 'result')]
  }

  getExpression(): [string, DataType] {
    const [value, dataType] = this.inputPorts[0].getValue();

    return [`fract(${value})`, dataType];
  }
}

export default Fraction;
