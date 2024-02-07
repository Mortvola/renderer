import { makeObservable, observable, runInAction } from "mobx";
import { DataType, GraphNodeInterface, NodeType } from "./Types";
import InputPort from "./Ports/InputPort";
import OutputPort from "./Ports/OutputPort";
import { GraphNodeDescriptor } from "./GraphDescriptor";

export let nextVarId = 0;

export const setNextVarid = (id: number) => {
  nextVarId = id;
}

const generatVarName = () => {
  const varName = `v${nextVarId}`
  nextVarId += 1;
  return varName;
}

class GraphNode implements GraphNodeInterface {
  type: NodeType;

  id: number;

  inputPorts: InputPort[] = [];

  outputPort: OutputPort[] = [];

  private outputVarName: string | null = null;

  position: { x: number, y: number };

  priority: number | null = null;

  constructor(type: NodeType, id?: number) {
    this.type = type;
    this.id = id ?? GraphNode.getNextNodeId();

    this.position = { x: 0, y: 0};
    
    if (this.id >= GraphNode.nextNodeId) {
      GraphNode.nextNodeId = this.id + 1;
    }

    makeObservable(this, {
      position: observable,
    });
  }

  createDescriptor(): GraphNodeDescriptor {
    return ({
      id: this.id,
      type: this.type,
      x: this.position?.x,
      y: this.position?.y,
      portValues: this.inputPorts
        .filter((p) => !p.edge && p.value)
        .map((p) => ({ port: p.name, value: p.value!.value })),
    })
  }

  getNumOutputEdges(): number {
    const numEdges = this.outputPort.reduce((count, p) => (
      count + p.edges.length
      ), 0)

    return numEdges;
  }

  getDataType(): DataType {
    return 'float'
  }

  getVarName(): [string, DataType] {
    if (this.outputVarName === null) {
      this.outputVarName = generatVarName();
    }

    return [this.outputVarName, this.getDataType()];
  }

  setVarName(name: string | null) {
    this.outputVarName = name;
  }

  getName(): string {
    return '';
  }

  getExpression(): [string, DataType] {
    return ['', this.getDataType()];
  }

  getValue(): [string, DataType] {
    if (this.getNumOutputEdges() > 1) {
      return this.getVarName() ?? ['', 'float'];
    }

    return this.getExpression();
  }

  output(): string { 
    if (this.getNumOutputEdges() <= 1) {
      return '';
    }

    const [lhs] = this.getVarName();
    const [rhs] = this.getExpression();

    return `var ${lhs} = ${rhs};\n`;
  }

  static nextNodeId = 0;

  static getNextNodeId(): number {
    GraphNode.nextNodeId += 1;

    return GraphNode.nextNodeId;
  }

  setPosition(x: number, y: number): void {
    runInAction(() => {
      this.position = { x, y }
    })
  }
}

export default GraphNode;
