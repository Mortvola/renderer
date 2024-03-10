import { ValueType, DataType, ValueInterface } from "./Types";

class Value implements ValueInterface {
  dataType: DataType;

  value: ValueType;

  constructor(dataType: DataType, value: ValueType) {
    this.dataType = dataType;
    this.value = value;
  }

  copy(): Value {
    return new Value(this.dataType, this.value)
  }

  getValueString(): [string, DataType] {
    switch (typeof this.value) {
      case 'string':
        return [this.value, this.dataType];

      case 'number': {
        if (this.dataType === 'uv') {
          return ['vertexOut.texcoord', this.dataType];
        }
      
        return [this.value.toString(), this.dataType];
      }

      case 'object': {
        if (Array.isArray(this.value)) {
          if (this.value.length === 2) {
            return [`vec2f(${this.value[0]}, ${this.value[1]})`, this.dataType];
          }
  
          if (this.value.length === 3) {
            return [`vec3f(${this.value[0]}, ${this.value[1]}, ${this.value[2]})`, this.dataType];
          }
  
          if (this.value.length === 4) {
            return [`vec4f(${this.value[0]}, ${this.value[1]}, ${this.value[2]}, ${this.value[3]})`, this.dataType];
          }
        }
      }
    }

    return ['', this.dataType];
  }
}

export default Value;
