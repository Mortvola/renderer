import { StructuredView, makeShaderDataDefinitions, makeStructuredView } from "webgpu-utils";
import { bindGroups } from "../BindGroups";
import { gpu } from "../Gpu";
import { MaterialDescriptor } from "../Materials/MaterialDescriptor";
import Property from "../ShaderBuilder/Property";
import { generateShaderModule } from "../ShaderBuilder/ShaderBuilder";
import { PropertyInterface } from "../ShaderBuilder/Types";
import { litShader } from "../shaders/lit";
import { PipelineInterface, PipelineManagerInterface } from "../types";
import CirclePipeline from "./CirclePipeline";
import LinePipeline from "./LinePipeline";
import LitPipeline from "./LitPipeline";
import OutlinePipeline from "./OutlinePipeline";
import Pipeline from "./Pipeline";
// import ReticlePipeline from "./ReticlePipeline";
import TrajectoryPipeline from "./TrajectoryPipeline";

export type PipelineType =
  'Lit' | 'pipeline' | 'Line' | 'billboard' | 'drag-handles' | 'Circle' | 'outline' | 'reticle' |
  'Trajectory';

type Pipelines = {
  type: PipelineType,
  pipeline: PipelineInterface,
}

type PipelineMapEntry = {
  pipeline: PipelineInterface,
  bindgroupLayout: GPUBindGroupLayout | null,
  properties: Property[],
  propertiesStructure: StructuredView | null,
  fromGraph: boolean,
}

class PipelineManager implements PipelineManagerInterface {
  // private static instance: PipelineManager | null = null;

  pipelines: Pipelines[] = [];

  pipelineMap: Map<string, PipelineMapEntry> = new Map();

  constructor() {
    this.pipelines = [];
  }

  async ready() {
    const result = await gpu.ready();

    if (result) {
      this.pipelines.push({ type: 'Lit', pipeline: new LitPipeline() });
      // this.pipelines.push({ type: 'pipeline', pipeline: new Pipeline() })
      this.pipelines.push({ type: 'Line', pipeline: new LinePipeline() });
      // this.pipelines.push({ type: 'billboard', pipeline: new BillboardPipeline() });
      // this.pipelines.push({ type: 'drag-handles', pipeline: new DragHandlesPipeline() });
      this.pipelines.push({ type: 'Circle', pipeline: new CirclePipeline() });
      this.pipelines.push({ type: 'outline', pipeline: new OutlinePipeline() });
      // this.pipelines.push({ type: 'reticle', pipeline: new ReticlePipeline() });
      this.pipelines.push({ type: 'Trajectory', pipeline: new TrajectoryPipeline() });
    }

    return result;
  }

  // public static getInstance(): PipelineManager {
  //   if (PipelineManager.instance === null) {
  //     PipelineManager.instance = new PipelineManager();
  //   }

  //   return this.instance!
  // }

  getPipeline(type: PipelineType): PipelineInterface | null {
    const entry = this.pipelines.find((pipeline) => pipeline.type === type);

    if (entry) {
      return entry.pipeline;
    }

    console.log(`pipeline ${type} not found.`)

    return null;
  }

  getPipelineByArgs(
    materialDescriptor: MaterialDescriptor,
  ): [PipelineInterface, GPUBindGroupLayout | null, PropertyInterface[], StructuredView | null, boolean] {
    let properties: Property[] = [];
    let bindgroupLayout: GPUBindGroupLayout | null = null;
    let propertiesStructure: StructuredView | null = null;
    let fromGraph = false;

    const key = JSON.stringify(materialDescriptor);

    let pipelineEntry: PipelineMapEntry | undefined = this.pipelineMap.get(key);

    if (pipelineEntry) {
      return [
        pipelineEntry.pipeline,
        pipelineEntry.bindgroupLayout,
        pipelineEntry.properties,
        pipelineEntry.propertiesStructure,
        pipelineEntry.fromGraph,
      ];
    }

    let pipeline: PipelineInterface;

    if (!materialDescriptor.graph) {
      pipeline = this.getPipeline(materialDescriptor.type)!

      this.pipelineMap.set(key, { pipeline, bindgroupLayout: null, properties: [], propertiesStructure: null, fromGraph: false });
    }
    else {
      fromGraph = true;

      let vertexBufferLayout: GPUVertexBufferLayout[] = [];

      let shaderModule: GPUShaderModule;
      let code: string;

      [shaderModule, properties, code] = generateShaderModule(materialDescriptor);  

      const defs = makeShaderDataDefinitions(code);
      
      if (defs.structs.Properties) {
        propertiesStructure = makeStructuredView(defs.structs.Properties);
      }

      vertexBufferLayout = [
        {
          attributes: [
            {
              shaderLocation: 0, // position
              offset: 0,
              format: "float32x4",
            },
          ],
          arrayStride: 16,
          stepMode: "vertex",
        },
        {
          attributes: [
            {
              shaderLocation: 1, // normal
              offset: 0,
              format: "float32x4",
            }
          ],
          arrayStride: 16,
          stepMode: "vertex",
        },
        {
          attributes: [
            {
              shaderLocation: 2, // texcoord
              offset: 0,
              format: "float32x2",
            }
          ],
          arrayStride: 8,
          stepMode: "vertex",
        }
      ];

      let target: GPUColorTargetState = {
        format: navigator.gpu.getPreferredCanvasFormat(),
      }

      let depthWriteEnabled = materialDescriptor.depthWriteEnabled ?? true;

      if (materialDescriptor.transparent) {
        target = {
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: {
              srcFactor: 'src-alpha' as GPUBlendFactor,
              dstFactor: 'one-minus-src-alpha' as GPUBlendFactor,
            },
            alpha: {
              srcFactor: 'src-alpha' as GPUBlendFactor,
              dstFactor: 'one-minus-src-alpha' as GPUBlendFactor,
            },
          },
        };  
      }

      // Create the bindgropu layout entries with samplers and textures, if any.
      let entries: GPUBindGroupLayoutEntry[] = [
        ...properties
          .filter((property) => ['sampler', 'texture2D'].includes(property.value.dataType))
          .map((property, index) => ({
            binding: index,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: property.value.dataType === 'sampler' ? {} : undefined,
            texture: property.value.dataType === 'texture2D' ? {} : undefined,
          })),
      ];

      // Add one additional bind group for the other data types. These will go into the Properties structure.
      if (properties.some((p) => !['sampler', 'texture2D'].includes(p.value.dataType))) {
        entries = entries.concat({
          binding: entries.length,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        })
      }

      const bindGroupDescriptor: GPUBindGroupLayoutDescriptor = {
        label: 'group2',
        entries,
      };

      bindgroupLayout = gpu.device.createBindGroupLayout(bindGroupDescriptor);

      const pipelineLayout = gpu.device.createPipelineLayout({
        bindGroupLayouts: [
          bindGroups.getBindGroupLayout0(),
          bindGroups.getBindGroupLayout1(),
          bindgroupLayout,
        ],
      });

      const pipelineDescriptor: GPURenderPipelineDescriptor = {
        label: 'base pipeline',
        vertex: {
          module: shaderModule,
          entryPoint: "vs",
          buffers: vertexBufferLayout,
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fs",
          targets: [target],
        },
        primitive: {
          topology: "triangle-list",
          cullMode: materialDescriptor.cullMode,
          frontFace: "ccw",
        },
        depthStencil: {
          depthWriteEnabled,
          depthCompare: "less",
          format: "depth24plus"
        },
        layout: pipelineLayout,
      };
      
      const gpuPipeline = gpu.device.createRenderPipeline(pipelineDescriptor);

      pipeline = new Pipeline();
      pipeline.pipeline = gpuPipeline;

      this.pipelineMap.set(key, { pipeline, bindgroupLayout, properties, propertiesStructure, fromGraph });
    }

    console.log(`pipelines created: ${this.pipelineMap.size}`)
    return [pipeline, bindgroupLayout, properties, propertiesStructure, fromGraph];
  }
}

export const pipelineManager = new PipelineManager();

export default PipelineManager;
