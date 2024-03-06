import BinaryOp from "./BinaryOp";

class Multiply extends BinaryOp {
  constructor(id?: number) {
    super('Multiply', 'Multiply', '*', id)
  }
}

export default Multiply;
