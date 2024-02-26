import { ValueDescriptor } from "./GraphDescriptor";
import GraphNode from "./GraphNode";
import OutputPort from "./Ports/OutputPort";
import { DataType, ValueInterface, ValueNodeInterface } from "./Types";

class ValueNode extends GraphNode implements ValueNodeInterface {
  value: ValueInterface;

  constructor(value: ValueInterface, id?: number) {
    super('value', id);

    this.outputPort = [new OutputPort(this, value.dataType, '')];

    this.value = value;
  }

  createDescriptor(): ValueDescriptor {
    return ({
      id: this.id,
      type: this.type,
      x: this.position?.x,
      y: this.position?.y,
      dataType: this.value.dataType,
      value: this.value.value,
    })
  }

  getDataType(): DataType {
    return this.value.dataType
  }

  getExpression(): [string, DataType] {
    return this.value.getValueString() ?? ['', this.getDataType()];
  }
}

export default ValueNode;
