import { DataType } from "../Types";
import OutputPort from "./OutputPort";

class AlphaPort extends OutputPort {
  getVarName(): [string, DataType] {
    if (this.node.getVarName()) {
      return [`${this.node.getVarName()}.a`, this.dataType]
    }

    return ['', this.dataType];
  }

  getValue(): [string, DataType] {
    if (this.node.getValue()) {
      const [varA] = this.node.getValue()

      return [`(${varA}).a`, this.dataType]
    }

    return ['', this.dataType];
  }

  getDataType(): DataType {
    return 'float'
  }
}

export default AlphaPort;
