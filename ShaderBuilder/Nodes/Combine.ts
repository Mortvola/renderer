import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import RGBPort from "../Ports/RGBPort";
import { DataType } from "../Types";

class Combine extends OperationNode {
  constructor(id?: number) {
    super('Combine', 'Combine', id)

    this.inputPorts = [
      new InputPort(this, 'float', 'r'),
      new InputPort(this, 'float', 'g'),
      new InputPort(this, 'float', 'b'),
      new InputPort(this, 'float', 'a'),
    ];

    this.outputPort = [
      new OutputPort(this, 'vec4f', 'rgba'),
      new RGBPort(this, 'vec3f', 'rgb'),
    ]
  }

  getExpression(): [string, DataType] {
    const [r] = this.inputPorts[0].getValue();
    const [g] = this.inputPorts[1].getValue();
    const [b] = this.inputPorts[2].getValue();
    const [a] = this.inputPorts[3].getValue();

    return [`vec4f(${r}, ${g}, ${b}, ${a})`, 'vec4f'];
  }
}

export default Combine;
