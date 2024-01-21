import InputPort from "../Ports/InputPort";
import { ValueInterface } from "../Types";
import ValueNode from "../ValueNode";

class Vector extends ValueNode {
  constructor(value: ValueInterface, id?: number) {
    super(value, id)

    if (Array.isArray(value.value)) {
      const getLabel = (i: number) => (
        i === 3 ? 'W' : String.fromCharCode('X'.charCodeAt(0) + i)
      )
    
      for (let i = 0; i < value.value.length; i += 1) {
        this.inputPorts.push(
          new InputPort(this, 'float', getLabel(i)),
        )
      }  
    }
  }

  getExpression(): string {
    return this.value.getValueString() ?? '';
  }
}

export default Vector;