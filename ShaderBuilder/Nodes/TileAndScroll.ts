import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";

class TileAndScroll extends OperationNode {
  constructor(id?: number) {
    super('TileAndScroll', 'TileAndScroll', id)

    this.inputPorts = [
      new InputPort(this, 'uv', 'uv'),
      new InputPort(this, 'vec2f', 'tile'),
      new InputPort(this, 'vec2f', 'scroll'),
    ];

    this.outputPort = [new OutputPort(this, 'vec2f', 'result')]
  }

  getExpression(): string {
    const uv = this.inputPorts[0].getValue();
    const tile = this.inputPorts[1].getValue();
    const scroll = this.inputPorts[2].getValue();

    return `(${uv}) * (${tile}) + ${scroll}`
  }
}

export default TileAndScroll;
