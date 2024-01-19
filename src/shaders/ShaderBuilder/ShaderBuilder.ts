import { gpu } from "../../Gpu";
import { common } from "../common";
import { textureAttributes } from "../textureAttributes";
import { texturedCommon } from "../texturedCommon";
import { texturedVertex } from "../texturedVertex";
import { GraphDescriptor, GraphStageDescriptor, PropertyDescriptor, ValueDescriptor } from "./GraphDescriptor";
import GraphEdge from "./GraphEdge";
import Output from "./Nodes/Display";
import Multiply from "./Nodes/Multiply";
import SampleTexture from "./Nodes/SampleTexture";
import TileAndScroll from "./Nodes/TileAndScroll";
import Time from "./Nodes/Time";
import UV from "./Nodes/UV";
import Property from "./Property";
import PropertyNode from "./PropertyNode";
import ShaderGraph from "./ShaderGraph";
import StageGraph from "./StageGraph";
import { DataType, GraphEdgeInterface, GraphNodeInterface, isPropertyNode, isValueNode } from "./Types";
import Value from "./Value";
import ValueNode from "./ValueNode";

let nextVarId = 0;
const getNextVarId = () => {
  nextVarId += 1;
  return nextVarId;
}

export const buildStageGraph = (graphDescr: GraphStageDescriptor, properties: Property[]): StageGraph => {
  let nodes: GraphNodeInterface[] = [];
  let edges: GraphEdgeInterface[] = [];

  // Create the nodes
  for (const nodeDescr of graphDescr.nodes) {
    // Make sure the id does not already exist.
    const prevNode = nodes.find((n) => nodeDescr.id === n.id);

    if (prevNode) {
      // The id already exists. Find the maxiumum node id and set it to the next one.
      // This may cause links to drop but it is better than losing nodes.
      const maxId = nodes.reduce((prev, n) => (
        Math.max(prev, n.id)
      ), 0);

      nodeDescr.id = maxId + 1;
    }

    let node: GraphNodeInterface | null = null;

    switch (nodeDescr.type) {
      case 'SampleTexture':
        node = new SampleTexture(nodeDescr.id)
        break;

      case 'property': 
        const propertyNode = nodeDescr as PropertyDescriptor;

        // Find property in property table
        const prop = properties.find((p) => p.name === propertyNode.name);

        if (prop) {
          node = new PropertyNode(prop, nodeDescr.id)
        }
        break;

      case 'display':
        node = new Output(nodeDescr.id);
        break;

      case 'uv':
        node = new UV(nodeDescr.id)
        break;

      case 'time':
        node = new Time(nodeDescr.id);
        break;

      case 'TileAndScroll':
        node = new TileAndScroll(nodeDescr.id);
        break;

      case 'Multiply':
        node = new Multiply(nodeDescr.id);
        break;

      case 'value': {
        const vnode = nodeDescr as ValueDescriptor;
        node = new ValueNode(new Value(vnode.dataType, vnode.value), nodeDescr.id);
        break;
      }
    }

    if (node) {
      node.x = nodeDescr.x ?? 0;
      node.y = nodeDescr.y ?? 0;

      nodes.push(node);
    }
  }

  for (const edgeDescr of graphDescr.edges) {
    const outputNode = nodes.find((n) => n.id === edgeDescr[0].id);
    const inputNode = nodes.find((n) => n.id === edgeDescr[1].id);

    if (outputNode && inputNode) {
      const inputPort = inputNode.inputPorts.find((p) => p.name === edgeDescr[1].port);
      const outputPort = outputNode.outputPort.find((p) => p.name === edgeDescr[0].port);

      // Make sure we have an output port, an input port and the input port does
      // not currently have an assigned edge.
      if (outputPort && inputPort && !inputPort.edge) {
        const edge = new GraphEdge(outputPort, inputPort);
        edges.push(edge);
      }
    }
  }

  return { nodes, edges };
}

export const generateStageShaderCode = (graph: StageGraph): [string, Property[]] => {
  // Clear the node priorities
  for (const node of graph.nodes) {
    node.priority = null;
  }

  const propertyBindings: Property[] = [];

  // Find the output node
  const outputNode = graph.nodes.find((n) => n.type === 'display');

  if (outputNode) {
    nextVarId = 0;
    let nextSamplerId = 0;

    outputNode.priority = 0;

    // Output the instructions.
    let stack: GraphNodeInterface[] = [outputNode];

    while (stack.length > 0) {
      const node = stack[0];
      stack = stack.slice(1)

      if (node.type === 'property') {
        if (isPropertyNode(node)) {
          if (!propertyBindings.some((p) => p === node.property)) {
            propertyBindings.push(node.property);
          }
        }
      }
      else {
        // For SamplerTexure nodes, fnd the property in the property list
        // that matches its sampler descriptor. If one is not found then
        // create a property for that sampler descriptor.
        if (node.type === 'SampleTexture') {
          const sampleTexture = (node as SampleTexture);
          const sampler = propertyBindings.find((p) => (
            p.value.dataType === 'sampler'
            && JSON.stringify(p.value.value) === JSON.stringify(sampleTexture.sampler)
          ))

          if (sampler) {
            sampleTexture.samplerName = sampler.name;
          }
          else {
            // Property was not found. Create a new property and add it to the
            // property binding list.
            const prop = new Property(`sampler${nextSamplerId}`, 'sampler', sampleTexture.sampler);
            nextSamplerId += 1;
            propertyBindings.push(prop);
            sampleTexture.samplerName = prop.name;
          }
        }

        // Push the input nodes onto the stack
        // and generate variables.
        for (const input of node.inputPorts) {
          if (input.edge) {
            // Set the var name on the incoming edge if it hasn't been
            // set yet.
            if (input.edge.getVarName() === '') {
              const varName = `v${getNextVarId()}`
              input.edge.setVarName(varName);
            }

            // Update the node priority if it is lower than 
            // the current node's priority plus 1.
            if (input.edge.output.node.priority ?? 0 < (node.priority ?? 0) + 1) {
              input.edge.output.node.priority = (node.priority ?? 0) + 1;
            }

            stack.push(input.edge.output.node);
          }
        }
      }
    }
  }

  const visitedNodes = graph.nodes.filter((n) => n.priority !== null);

  visitedNodes.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

  let body = '';

  for (const node of visitedNodes) {
    const text = node.output();
    body = text.concat(body);
  }

  return [body, propertyBindings];
}

export const buildGraph = (graphDescriptor: GraphDescriptor, properties: Property[]): ShaderGraph => {
  const graph = new ShaderGraph();

  if (graphDescriptor?.fragment) {
    graph.fragment = buildStageGraph(graphDescriptor?.fragment, properties);
  }

  return graph;
}

const bindingType = (dataType: DataType) => {  
  if (dataType === 'texture2D') {
    return 'texture_2d<f32>';
  }

  return dataType;
}

export const generateShaderCode = (graph: ShaderGraph): [string, Property[]] => {
  let body = '';

  let bindings = '';
  let numBindings = 0;
  let properties: Property[] = [];

  if (graph.fragment) {
    [body, properties] = generateStageShaderCode(graph.fragment);

    for (let i = 0; i < properties.length; i += 1) {
      bindings = bindings.concat(
        `@group(2) @binding(${i + 1}) var ${properties[i].name}: ${bindingType(properties[i].value.dataType)};\n`
      )
      numBindings += 1;
    }
  
    console.log(body);
  }

  //     @group(2) @binding(1) var ourSampler: sampler;
  //     @group(2) @binding(2) var ourTexture: texture_2d<f32>;

  return [
    `
    ${texturedCommon}
    
    ${common}
  
    ${texturedVertex}
    
    ${textureAttributes}

    ${bindings}
    @group(2) @binding(${numBindings + 1}) var<uniform> texAttr: TextureAttributes;
    
    @fragment
    fn fs(vertexOut: VertexOut) -> @location(0) vec4f
    {
      ${body}
    }
    `,
    properties,
  ]
}

export const generateShaderModule = (graph: ShaderGraph): [GPUShaderModule, Property[]] => {
  const [code, properties] = generateShaderCode(graph);

  const shaderModule = gpu.device.createShaderModule({
    label: 'custom shader',
    code: code,
  })

  return [shaderModule, properties];
}

export const createDescriptor = (nodes: GraphNodeInterface[], edges: GraphEdgeInterface[]): GraphDescriptor => {
  const descriptor: GraphDescriptor = {
    vertex: {
      nodes: [],
      edges: [],
    },

    fragment: {
      nodes: nodes.map((n) => {
        if (isPropertyNode(n)) {
          return ({
            id: n.id,
            name: n.property.name,
            type: n.type,  
            x: n.x,
            y: n.y,
          })
        }

        if (isValueNode(n)) {
          return ({
            id: n.id,
            type: n.type,
            x: n.x,
            y: n.y,
            dataType: n.value.dataType,
            value: n.value.value,
          })
        }

        return ({
          id: n.id,
          type: n.type,
          x: n.x,
          y: n.y,
        })
      }),

      edges: edges.map((e) => (
        [{ id: e.output.node.id, port: e.output.name}, { id: e.input.node.id, port: e.input.name}]
      ))
    }
  }

  return descriptor;
}