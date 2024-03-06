import BinaryOp from "./BinaryOp";

class Divide extends BinaryOp {
  constructor(id?: number) {
    super('Divide', 'Divide', '/', id)
  }
}

export default Divide;
