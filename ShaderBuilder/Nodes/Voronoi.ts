import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class Voronoi extends OperationNode {
  constructor(id?: number) {
    super('Voronoi', 'Voronoi', id)

    this.inputPorts = [
      new InputPort(this, 'vec2f', 'uv'),
      new InputPort(this, 'float', 'density'),
    ];

    this.outputPort = [
      new OutputPort(this, 'float', 'result'),
    ]
  }

  getExpression(): [string, DataType] {
    const [uv] = this.inputPorts[0].getValue();
    const [density] = this.inputPorts[1].getValue();

    return [`voronoi(${uv}, ${density})`, 'float'];
  }
}

export default Voronoi;
