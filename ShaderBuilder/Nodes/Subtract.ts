import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";

class Subtract extends OperationNode {
  constructor(id?: number) {
    super('Subtract', 'Subtract', id)

    this.inputPorts = [
      new InputPort(this, 'vec2f', 'A'),
      new InputPort(this, 'vec2f', 'B'),
    ];

    this.outputPort = [new OutputPort(this, 'vec2f', 'result')]
  }

  getExpression(): string {
    const varA = this.inputPorts[0].getValue();
    const varB = this.inputPorts[1].getValue();

    return `${varA} - (${varB})`;
  }
}

export default Subtract;