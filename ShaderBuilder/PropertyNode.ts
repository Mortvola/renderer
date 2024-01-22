import { makeObservable, observable } from "mobx";
import GraphNode from "./GraphNode";
import OutputPort from "./Ports/OutputPort";
import { PropertyNodeInterface } from "./Types";
import Property from "./Property";

class PropertyNode extends GraphNode implements PropertyNodeInterface {
  property: Property;

  readonly = false;

  constructor(property: Property, id?: number) {
    super('property', id)

    this.property = property;

    this.outputPort = [new OutputPort(this, property.value.dataType, property.name)];

    makeObservable(this, {
      property: observable,
    })
  }

  getVarName() {
    return this.property.name;
  }

  setVarName(varName: string | null) {
  }

  getName(): string {
    return this.property.name;
  }

  getValue(): string {
    if (this.property.value.dataType === 'texture2D' || this.property.value.dataType === 'sampler') {
      return this.getVarName();
    }

    return `properties.${this.getVarName()}`;
  }

  output(): string {
    return '';
  }
}

export default PropertyNode;
