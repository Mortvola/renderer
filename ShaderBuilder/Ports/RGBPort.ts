import { DataType } from "../Types";
import OutputPort from "./OutputPort";

class RGBPort extends OutputPort {
  getVarName(): [string, DataType] {
    if (this.node.getVarName()) {
      return [`${this.node.getVarName()}.rgb`, this.dataType]
    }

    return ['', this.dataType];
  }

  getValue(): [string, DataType] {
    if (this.node.getValue()) {
      const [varA] = this.node.getValue()

      return [`(${varA}).rgb`, this.dataType]
    }

    return ['', this.dataType];
  }
}

export default RGBPort;
