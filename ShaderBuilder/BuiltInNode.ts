import GraphNode from "./GraphNode";
import { DataType, NodeType } from "./Types";

class BuiltIn extends GraphNode {
  name: string;

  property: boolean;

  constructor(type: NodeType, name: string, property: boolean, id?: number) {
    super(type, id)

    this.name = name;
    this.property = property;
  }

  getName(): string {
    return this.name;
  }

  getExpression(): [string, DataType] {
    return this.getVarName() ?? ['', 'float'];
  }
}

export default BuiltIn;
