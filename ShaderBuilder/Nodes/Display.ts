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
    const [alpha] = this.inputPorts[1].getValue()

    if (this.inputPorts[1].edge) {
      const [varA] = this.inputPorts[0].getValue()

      return [`vec4f((${varA}).rgb, ${alpha})`, 'vec4f'];
    }

    const [varA, dataType] = this.inputPorts[0].getValue();

    if (dataType === 'vec2f') {
      return [`vec4f(${varA}, 0, ${alpha})`, 'vec4f'];
    }

    if (dataType === 'vec3f') {
      return [`vec4f(${varA}, ${alpha})`, 'vec4f'];
    }

    return [`${varA}`, 'vec4f'];
  }

  output(): string {
    const [value] = this.getExpression()

    return `var fragOut = ${value};`;
  }
}

export default Display;
