import OutputPort from "./OutputPort";

class AlphaPort extends OutputPort {
  getVarName(): string {
    if (this.node.getVarName()) {
      return `${this.node.getVarName()}.a`
    }

    return '';
  }

  getValue(): string {
    if (this.node.getValue()) {
      return `${this.node.getValue()}.a`
    }

    return '';
  }
}

export default AlphaPort;
