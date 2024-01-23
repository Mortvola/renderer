import OperationNode from "../OperationNode";
import AlphaPort from "../Ports/AlphaPort";
import BluePort from "../Ports/BluePort";
import GreenPort from "../Ports/GreenPort";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import RedPort from "../Ports/RedPort";
import { SamplerDescriptor } from "../Types";

class PhongShading extends OperationNode {
  sampler: SamplerDescriptor = {};

  samplerName: string | null = null;

  constructor(id?: number) {
    super('PhongShading', 'Phong Shading', id)

    this.inputPorts = [
      new InputPort(this, 'vec4f', 'rgba'),
    ];

    this.outputPort = [
      new OutputPort(this, 'vec4f', 'rgba'),
      new RedPort(this, 'float', 'r'),
      new GreenPort(this, 'float', 'g'),
      new BluePort(this, 'float', 'b'),
      new AlphaPort(this, 'float', 'a'),
    ]
  }

  getExpression(): string {
    const color = this.inputPorts[0].getValue();
    return `phong(vertexOut, ${color})`;
  }
}

export default PhongShading;
