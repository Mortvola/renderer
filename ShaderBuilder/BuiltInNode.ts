import GraphNode from "./GraphNode";
import { NodeType } from "./Types";

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

  getExpression(): string {
    return this.getVarName() ?? '';
  }
}

export default BuiltIn;
