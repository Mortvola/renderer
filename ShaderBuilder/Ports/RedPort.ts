import OutputPort from "./OutputPort";

class RedPort extends OutputPort {
  getVarName(): string {
    if (this.node.getVarName()) {
      return `${this.node.getVarName()}.r`
    }

    return '';
  }

  getValue(): string {
    if (this.node.getValue()) {
      return `${this.node.getValue()}.r`
    }

    return '';
  }
}

export default RedPort;
