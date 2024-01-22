import { DataType, GraphNodeInterface, PortInterface } from "../Types";

class Port implements PortInterface {
  node: GraphNodeInterface;

  dataType: DataType;

  name: string;

  offsetX = 0;

  offsetY = 0;
  
  constructor(node: GraphNodeInterface, dataType: DataType, name: string) {
    this.node = node;
    this.dataType = dataType;
    this.name = name;    
  }
}

export default Port;
