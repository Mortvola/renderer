import { makeObservable, observable } from "mobx";
import { DataType, GraphEdgeInterface, GraphNodeInterface, InputPortInterface } from "../Types";
import Port from "./Port";
import Value from "../Value";

class InputPort extends Port implements InputPortInterface {
  edge: GraphEdgeInterface | null = null;

  value?: Value;

  constructor(node: GraphNodeInterface, dataType: DataType, name: string) {
    super(node, dataType, name);

    switch (dataType) {
      case 'float':
        this.value = new Value(dataType, 0);
        break;

      case 'vec2f':
        this.value = new Value(dataType, [0, 0]);
        break;

      case 'vec3f':
        this.value = new Value(dataType, [0, 0, 0]);
        break;

      case 'vec4f':
        this.value = new Value(dataType, [0, 0, 0, 0]);
        break;

      case 'uv':
        this.value = new Value(dataType, 0);
        break;
    }

    makeObservable(this, {
      edge: observable,
    })
  }

  getVarName(): string {
    return this.edge?.getVarName() ?? '';
  }

  getValue(): string {
    if (this.edge) {
      return this.edge.getValue();
    }

    if (this.value) {
      return this.value.getValueString();
    }

    return '';
  }
}

export default InputPort;
