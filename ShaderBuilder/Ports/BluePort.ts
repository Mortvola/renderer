import OutputPort from "./OutputPort";

class BluePort extends OutputPort {
  getVarName(): string {
    if (this.node.getVarName()) {
      return `${this.node.getVarName()}.b`
    }

    return '';
  }

  getValue(): string {
    if (this.node.getValue()) {
      return `${this.node.getValue()}.b`
    }

    return '';
  }
}

export default BluePort;
