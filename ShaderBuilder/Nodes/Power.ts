import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";

class Power extends OperationNode {
  constructor(id?: number) {
    super('Power', 'Power', id)

    this.inputPorts = [
      new InputPort(this, 'vec2f', 'A'),
      new InputPort(this, 'float', 'B'),
    ];

    this.outputPort = [new OutputPort(this, 'float', 'result')]
  }

  getExpression(): string {
    const varA = this.inputPorts[0].getValue();
    const varB = this.inputPorts[1].getValue();

    return `pow(${varA}, ${varB})`;
  }
}

export default Power;
