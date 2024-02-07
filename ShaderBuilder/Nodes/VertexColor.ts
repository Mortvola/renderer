import BuiltIn from "../BuiltInNode";
import OutputPort from "../Ports/OutputPort";

class VertexColor extends BuiltIn {
  constructor(id?: number) {
    super('VertexColor', 'Vertex Color', false, id)

    this.outputPort = [new OutputPort(this, 'vec4f', 'out')];
    this.setVarName('time');
  }

  setVarName(varName: string | null): void {
    super.setVarName('vertexOut.color');
  }
}

export default VertexColor;
