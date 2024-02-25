import OperationNode from "../OperationNode";
import InputPort from "../Ports/InputPort";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class Distance extends OperationNode {
  constructor(id?: number) {
    super('Distance', 'Distance', id)

    this.inputPorts = [
      new InputPort(this, 'vec2f', 'A'),
      new InputPort(this, 'vec2f', 'B'),
    ];

    this.outputPort = [new OutputPort(this, 'float', 'result')]
  }

  getDataType(): DataType {
    return 'float'
  }

  getExpression(): [string, DataType] {
    const [varA] = this.inputPorts[0].getValue();
    const [varB] = this.inputPorts[1].getValue();

    return [`distance(${varA}, ${varB})`, 'float'];
  }
}

export default Distance;
