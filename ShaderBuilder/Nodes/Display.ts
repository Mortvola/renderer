import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import { DataType } from "../Types";

class Display extends OperationNode {
  constructor(id?: number) {
    super('display', 'Display', id)

    this.inputPorts = [
      new InputPort(this, 'vec4f', 'rgb'),
      new InputPort(this, 'float', 'a'),
    ]
  }

  getExpression(): [string, DataType] {
    if (this.inputPorts[1].edge) {
      const [varA] = this.inputPorts[0].getValue()
      const [varB] = this.inputPorts[1].getValue()

      return [`vec4f((${varA}).rgb, ${varB})`, 'vec4f'];
    }

    const [varA] = this.inputPorts[0].getValue();

    return [`${varA}`, 'vec4f'];
  }

  output(): string {
    const [value] = this.getExpression()

    return `var fragOut = ${value};`;
  }
}

export default Display;
