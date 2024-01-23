import { gpu } from "../Gpu";
import { MaterialDescriptor } from "../Materials/MaterialDescriptor";
import { common } from "../shaders/common";
import { phongFunction } from "../shaders/phongFunction";
import { GraphDescriptor, GraphStageDescriptor, PropertyDescriptor, ValueDescriptor } from "./GraphDescriptor";
import GraphEdge from "./GraphEdge";
import { setNextVarid } from "./GraphNode";
import Add from "./Nodes/Add";
import Output from "./Nodes/Display";
import Fraction from "./Nodes/Fraction";
import Multiply from "./Nodes/Multiply";
import PhongShading from "./Nodes/PhongShading";
import SampleTexture from "./Nodes/SampleTexture";
import TileAndScroll from "./Nodes/TileAndScroll";
import Time from "./Nodes/Time";
import UV from "./Nodes/UV";
import Vector from "./Nodes/Vector";
import Property from "./Property";
import PropertyNode from "./PropertyNode";
import ShaderGraph from "./ShaderGraph";
import StageGraph from "./StageGraph";
import { DataType, GraphEdgeInterface, GraphNodeInterface, getLength, isPropertyNode, isValueNode } from "./Types";
import Value from "./Value";
import ValueNode from "./ValueNode";

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

      case 'Fraction':
        node = new Fraction(nodeDescr.id);
        break;

      case 'Multiply':
        node = new Multiply(nodeDescr.id);
        break;

      case 'Add':
        node = new Add(nodeDescr.id);
        break;

      case 'PhongShading':
        node = new PhongShading(nodeDescr.id);
        break;
  
      case 'value': {
        const vnode = nodeDescr as ValueDescriptor;

        if (vnode.dataType === 'vec2f') {
          node = new Vector(new Value(vnode.dataType, vnode.value), vnode.id)
        }
        else {
          node = new ValueNode(new Value(vnode.dataType, vnode.value), nodeDescr.id);
        }
    
        break;
      }
    }

    if (node) {
      node.position = { x: nodeDescr.x ?? 0, y: nodeDescr.y ?? 0 }

      if (nodeDescr.portValues) {
        for (const portValue of nodeDescr.portValues) {
          const port = node.inputPorts.find((p) => p.name === portValue.port);

          if (port) {
            switch (port.dataType) {
              case 'float':
              case 'vec2f':
              case 'vec3f':
              case 'vec4f':
                if (Array.isArray(portValue.value)) {
                  portValue.value.length = getLength(port.dataType)
                }
    
                port.value = new Value(port.dataType, portValue.value)
    
                break;

              case 'uv':
                port.value = new Value(port.dataType, 0);
                break;
            }
          }
        }
      }

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

export const generateStageShaderCode = (graph: StageGraph): [string, Property[], Property[]] => {
  // Clear the node priorities
  for (const node of graph.nodes) {
    node.priority = null;
    node.setVarName(null);
  }

  const properties: Property[] = [];
  const uniformBindings: Property[] = [];

  // Find the output node
  const outputNode = graph.nodes.find((n) => n.type === 'display');

  if (outputNode) {
    setNextVarid(0);
    let nextSamplerId = 0;

    outputNode.priority = 0;

    // Output the instructions.
    let stack: GraphNodeInterface[] = [outputNode];

    while (stack.length > 0) {
      const node = stack[0];
      stack = stack.slice(1)

      if (node.type === 'property') {
        if (isPropertyNode(node)) {
          if (node.property.value.dataType === 'texture2D' || node.property.value.dataType === 'sampler') {
            if (!uniformBindings.some((p) => p === node.property)) {
              uniformBindings.push(node.property);
            }  
          }
          else {
            if (!properties.some((p) => p === node.property)) {
              properties.push(node.property);
            }  
          }
        }
      }
      else {
        // For SamplerTexure nodes, find the property in the property list
        // that matches its sampler descriptor. If one is not found then
        // create a property for that sampler descriptor.
        if (node.type === 'SampleTexture') {
          const sampleTexture = (node as SampleTexture);
          const sampler = uniformBindings.find((p) => (
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
            uniformBindings.push(prop);
            sampleTexture.samplerName = prop.name;
          }
        }

        // Push the input nodes onto the stack
        // and generate variables.
        for (const input of node.inputPorts) {
          if (input.edge) {
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

  return [body, uniformBindings, properties];
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

  if (dataType === 'float') {
    return 'f32';
  }

  return dataType;
}

const space = (dataType: DataType) => {
  if (dataType !== 'texture2D' && dataType !== 'sampler') {
    return '<uniform>';
  }

  return '';
}

export const generateShaderCode = (graph: ShaderGraph, lit: boolean): [string, Property[], Record<string, unknown>] => {
  let body = '';

  let bindings = '';
  let uniforms = '';
  let uniformValues: Record<string, unknown> = {};
  let numBindings = 0;
  let uniformBindings: Property[] = [];
  let properties: Property[] = [];

  if (graph.fragment) {
    [body, uniformBindings, properties] = generateStageShaderCode(graph.fragment);

    for (let i = 0; i < uniformBindings.length; i += 1) {
      if (uniformBindings[i].value.dataType === 'texture2D' || uniformBindings[i].value.dataType === 'sampler') {
        bindings = bindings.concat(
          `@group(2) @binding(${i}) var${space(uniformBindings[i].value.dataType)} ${uniformBindings[i].name}: ${bindingType(uniformBindings[i].value.dataType)};\n`
        )  

        numBindings += 1;
      }
    }

    for (let i = 0; i < properties.length; i += 1) {
      uniforms = uniforms.concat(
        `${properties[i].name}: ${bindingType(properties[i].value.dataType)},`
      )

      uniformValues = {
        ...uniformValues,
        [properties[i].name]: properties[i].value.value,
      }
    }
  
    console.log(body);
  }

  if (uniforms !== '') {
    bindings = bindings.concat(
      `@group(2) @binding(${numBindings}) var<uniform> properties: Properties;`
    )
    numBindings += 1;

    uniforms = `struct Properties { ${uniforms} }\n`
  }

  return [
    `
    struct Vertex {
      @location(0) position: vec4f,
      @location(1) normal: vec4f,
      @location(2) texcoord: vec2f,
    }
    
    struct VertexOut {
      @builtin(position) position : vec4f,
      @location(0) texcoord: vec2f,
      ${lit ? '@location(1) fragPos: vec4f,\n@location(2) normal: vec4f,' : ''}    
    }
        
    ${common}
  
    @vertex
    fn vs(
      @builtin(instance_index) instanceIndex: u32,
      vert: Vertex,
    ) -> VertexOut
    {
      var output: VertexOut;
    
      output.position = projectionMatrix * viewMatrix * modelMatrix[instanceIndex] * vert.position;
      output.texcoord = vert.texcoord;
    
      ${lit
        ? `
        output.fragPos = viewMatrix * modelMatrix[0] * vert.position;
        output.normal = viewMatrix * modelMatrix[0] * vert.normal;          
        `
        : ''
      }
    
      return output;
    }

    ${uniforms}

    ${bindings}
    
    ${lit ? phongFunction : ''}

    @fragment
    fn fs(vertexOut: VertexOut) -> @location(0) vec4f
    {
      ${body}
    }
    `,
    uniformBindings,
    uniformValues,
  ]
}

export const generateMaterial = (materialDescriptor: MaterialDescriptor) => {
  let props: Property[] = [];

  if (materialDescriptor.properties) {
    props = materialDescriptor.properties.map((p) => (
      new Property(p.name, p.dataType, p.value)
    ))
  }

  const graph = buildGraph(materialDescriptor.graph!, props);

  return generateShaderCode(graph, materialDescriptor.lit ?? false);
}

export const generateShaderModule = (materialDescriptor: MaterialDescriptor): [GPUShaderModule, Property[], string, Record<string, unknown>] => {
  const [code, properties, values] = generateMaterial(materialDescriptor);
  
  const shaderModule = gpu.device.createShaderModule({
    label: 'custom shader',
    code: code,
  })

  return [shaderModule, properties, code, values];
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
            x: n.position?.x,
            y: n.position?.y,
          })
        }

        if (isValueNode(n)) {
          return ({
            id: n.id,
            type: n.type,
            x: n.position?.x,
            y: n.position?.y,
            dataType: n.value.dataType,
            value: n.value.value,
          })
        }

        return ({
          id: n.id,
          type: n.type,
          x: n.position?.x,
          y: n.position?.y,
          portValues: n.inputPorts
            .filter((p) => !p.edge && p.value)
            .map((p) => ({ port: p.name, value: p.value!.value })),
        })
      }),

      edges: edges.map((e) => (
        [{ id: e.output.node.id, port: e.output.name}, { id: e.input.node.id, port: e.input.name}]
      ))
    }
  }

  return descriptor;
}