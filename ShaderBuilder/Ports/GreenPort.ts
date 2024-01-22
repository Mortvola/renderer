import OutputPort from "./OutputPort";

class GreenPort extends OutputPort {
  getVarName(): string {
    if (this.node.getVarName()) {
      return `${this.node.getVarName()}.g`
    }

    return '';
  }

  getValue(): string {
    if (this.node.getValue()) {
      return `${this.node.getValue()}.g`
    }

    return '';
  }
}

export default GreenPort;
