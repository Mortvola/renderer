import { makeObservable, observable, runInAction } from "mobx";
import { GraphNodeInterface, NodeType } from "./Types";
import InputPort from "./Ports/InputPort";
import OutputPort from "./Ports/OutputPort";

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

  getNumOutputEdges(): number {
    const numEdges = this.outputPort.reduce((count, p) => (
      count + p.edges.length
      ), 0)

    return numEdges;
  }

  getVarName(): string | null {
    if (this.outputVarName === null) {
      this.outputVarName = generatVarName();
    }

    return this.outputVarName;
  }

  setVarName(name: string | null) {
    this.outputVarName = name;
  }

  getName(): string {
    return '';
  }

  getExpression(): string {
    return '';
  }

  getValue(): string {
    if (this.getNumOutputEdges() > 1) {
      return this.getVarName() ?? '';
    }

    return this.getExpression();
  }

  output(): string { 
    if (this.getNumOutputEdges() <= 1) {
      return '';
    }

    return `var ${this.getVarName()} = ${this.getExpression()};\n`;
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
