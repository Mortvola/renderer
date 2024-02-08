import { DataType } from "../Types";
import OutputPort from "./OutputPort";

class GreenPort extends OutputPort {
  getVarName(): [string, DataType] {
    if (this.node.getVarName()) {
      return [`${this.node.getVarName()}.g`, this.dataType]
    }

    return ['', this.dataType];
  }

  getValue(): [string, DataType] {
    if (this.node.getValue()) {
      const [varA] = this.node.getValue()

      return [`(${varA}).g`, this.dataType]
    }

    return ['', this.dataType];
  }
}

export default GreenPort;
