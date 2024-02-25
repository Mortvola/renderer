import BuiltIn from "../BuiltInNode";
import OutputPort from "../Ports/OutputPort";
import { DataType } from "../Types";

class UV extends BuiltIn {
  constructor(id?: number) {
    super('uv', 'UV', false, id)

    this.outputPort = [new OutputPort(this, 'vec2f', 'uv')];
    this.setVarName('vertexOut.texcoord');
  }

  setVarName(varName: string | null): void {
    super.setVarName('vertexOut.texcoord')
  }

  getDataType(): DataType {
    return 'vec2f'
  }
}

export default UV;
