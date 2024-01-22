import OperationNode from "../OperationNode";
import AlphaPort from "../Ports/AlphaPort";
import BluePort from "../Ports/BluePort";
import GreenPort from "../Ports/GreenPort";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import RedPort from "../Ports/RedPort";
import { SamplerDescriptor } from "../Types";

class SampleTexture extends OperationNode {
  sampler: SamplerDescriptor = {};

  samplerName: string | null = null;

  constructor(id?: number) {
    super('SampleTexture', 'SampleTexture', id)

    this.inputPorts = [
      new InputPort(this, 'texture2D', 'texture'),
      // new InputPort(this, 'sampler', 'sampler'),
      new InputPort(this, 'uv', 'uv'),
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
    const texture = this.inputPorts[0].getValue();
    const sampler = this.samplerName;
    const textCoord = this.inputPorts[1].getValue();
    // console.log(`var ${outputVar} = textureSample(ourTexture, ourSampler, fract(vertexOut.texcoord * texAttr.scale + offset));`);
    return `textureSample(${texture}, ${sampler}, ${textCoord})`;
  }
}

export default SampleTexture;
