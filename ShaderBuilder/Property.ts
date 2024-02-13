import { makeObservable, observable } from "mobx";
import { PropertyInterface, ValueType, DataType } from "./Types";
import Value from "./Value";

class Property implements PropertyInterface {
  name: string;

  value: Value;

  constructor(name: string, dataType: DataType, value: ValueType) {
    this.name = name;
    this.value = new Value(dataType, value);

    makeObservable(this, {
      name: observable,
      value: observable,
    })
  }
}

export default Property;
