import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";

class Display extends OperationNode {
  constructor(id?: number) {
    super('display', 'Display', id)

    this.inputPorts = [
      new InputPort(this, 'vec4f', 'rgb'),
      new InputPort(this, 'float', 'a'),
    ]
  }

  getExpression(): string {
    if (this.inputPorts[1].edge) {
      return `vec4f(${this.inputPorts[0].getValue()}.rgb, ${this.inputPorts[1].getValue()})`;
    }

    return `${this.inputPorts[0].getValue()}`;
  }

  output(): string {
    return `return ${this.getExpression()};`;
  }
}

export default Display;
