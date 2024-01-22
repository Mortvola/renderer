import BuiltIn from "../BuiltInNode";
import OutputPort from "../Ports/OutputPort";

class Time extends BuiltIn {
  constructor(id?: number) {
    super('time', 'Time', false, id)

    this.outputPort = [new OutputPort(this, 'float', 'time')];
    this.setVarName('time');
  }

  setVarName(varName: string | null): void {
    super.setVarName('time');
  }
}

export default Time;
