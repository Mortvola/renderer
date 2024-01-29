import OutputPort from "./OutputPort";

class RGBPort extends OutputPort {
  getVarName(): string {
    if (this.node.getVarName()) {
      return `${this.node.getVarName()}.rgb`
    }

    return '';
  }

  getValue(): string {
    if (this.node.getValue()) {
      return `${this.node.getValue()}.rgb`
    }

    return '';
  }
}

export default RGBPort;
