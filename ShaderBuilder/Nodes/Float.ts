import OutputPort from "../Ports/OutputPort";
import Value from "../Value";
import ValueNode from "../ValueNode";

class Float extends ValueNode {
  constructor(id?: number) {
    super(new Value('float', 0), id)

    this.outputPort = [new OutputPort(this, 'float', 'float')];
  }
}

export default Float;
