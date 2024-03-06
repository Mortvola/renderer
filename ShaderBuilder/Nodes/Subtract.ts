import BinaryOp from "./BinaryOp";

class Subtract extends BinaryOp {
  constructor(id?: number) {
    super('Subtract', 'Subtract', '-', id)
  }
}

export default Subtract;
