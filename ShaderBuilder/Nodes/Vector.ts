import InputPort from "../Ports/InputPort";
import { DataType, ValueInterface } from "../Types";
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

  getExpression(): [string, DataType] {
    let expression = '';

    for (const port of this.inputPorts) {
      const [value] = port.getValue()
      expression += `${value},`
    }

    // TODO: fix this for other vector sizes.
    return [`vec2f(${expression})`, this.getDataType()];
  }
}

export default Vector;
