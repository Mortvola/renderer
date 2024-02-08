import { makeObservable, observable } from "mobx";
import GraphNode from "./GraphNode";
import OutputPort from "./Ports/OutputPort";
import { DataType, PropertyNodeInterface } from "./Types";
import Property from "./Property";
import { PropertyDescriptor } from "./GraphDescriptor";

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

  createDescriptor(): PropertyDescriptor {
    return ({
      id: this.id,
      name: this.property.name,
      type: this.type,  
      x: this.position?.x,
      y: this.position?.y,
    })
  }

  getVarName(): [string, DataType] {
    return [this.property.name, this.getDataType()];
  }

  setVarName(varName: string | null) {
  }

  getName(): string {
    return this.property.name;
  }

  getValue(): [string, DataType] {
    if (this.property.value.dataType === 'texture2D' || this.property.value.dataType === 'sampler') {
      return this.getVarName();
    }

    const [varA] = this.getVarName()

    return [`fragProperties.${varA}`, this.getDataType()];
  }

  output(): string {
    return '';
  }
}

export default PropertyNode;
