import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class TextureSize extends OperationNode {
  constructor(id?: number) {
    super('TextureSize', 'TextureSize', id)

    this.inputPorts = [
      new InputPort(this, 'texture2D', 'texture'),
    ];

    this.outputPort = [
      new OutputPort(this, 'vec2f', 'dimensions'),
    ];
  }

  getDataType(): DataType {
    return 'vec2f'
  }
  
  getExpression(): [string, DataType] {
    const [texture] = this.inputPorts[0].getValue();
    return [`vec2f(textureDimensions(${texture}))`, 'vec2f'];
  }
}

export default TextureSize;
