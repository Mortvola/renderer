import BinaryOp from "./BinaryOp";

class Add extends BinaryOp {
  constructor(id?: number) {
    super('Add', 'Add', '+', id)
  }
}

export default Add;
