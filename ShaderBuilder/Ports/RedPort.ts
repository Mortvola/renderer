import { DataType } from "../Types";
import OutputPort from "./OutputPort";

class RedPort extends OutputPort {
  getVarName(): [string, DataType] {
    if (this.node.getVarName()) {
      return [`${this.node.getVarName()}.r`, this.dataType]
    }

    return ['', this.dataType];
  }

  getValue(): [string, DataType] {
    if (this.node.getValue()) {
      const [varA] = this.node.getValue()

      return [`(${varA}).r`, this.dataType]
    }

    return ['', this.dataType];
  }
}

export default RedPort;
