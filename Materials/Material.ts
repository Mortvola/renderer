import { gpu } from "../Gpu";
import { pipelineManager } from "../Pipelines/PipelineManager";
import { DrawableType, MaterialInterface, PipelineInterface, StageBindings } from "../types";
import { PropertyInterface, ValueType } from "../ShaderBuilder/Types";
import Http from "../../Http/src";
import { MaterialDescriptor } from "./MaterialDescriptor";
import { shaderManager } from "../shaders/ShaderManager";
import { ShaderDescriptor } from "../shaders/ShaderDescriptor";

const downloadedTextures: Map<number, GPUTexture> = new Map();
const texturePromises: Map<number, Promise<GPUTexture>> = new Map();

type MaterialBindings = {
  uniformsBuffer: GPUBuffer | null,
  stageBindings: StageBindings,
  bindGroup: GPUBindGroup,
}

class Material implements MaterialInterface {
  pipeline: PipelineInterface | null = null;

  color = new Float32Array(4);

  vertBindings: MaterialBindings | null = null;

  fragBindings: MaterialBindings | null = null;

  lit: boolean;

  transparent: boolean;

  decal: boolean;

  private constructor(
    shaderDescriptor: ShaderDescriptor | null,
    pipeline: PipelineInterface,
    textures: GPUTexture[],
    fragProperties?: PropertyInterface[],
    vertProperties?: PropertyInterface[],
  ) {
    this.pipeline = pipeline;
    
    this.color[0] = shaderDescriptor?.color ? shaderDescriptor.color[0] : 0.5;
    this.color[1] = shaderDescriptor?.color ? shaderDescriptor.color[1] : 0.5;
    this.color[2] = shaderDescriptor?.color ? shaderDescriptor.color[2] : 0.5;
    this.color[3] = shaderDescriptor?.color ? shaderDescriptor.color[3] : 1;
    
    this.decal = shaderDescriptor?.type === 'Decal'
    this.lit = shaderDescriptor?.lit ?? false;
    this.transparent = shaderDescriptor?.transparent ?? false;

    if (pipeline.vertexStageBindings) {
      const [uniformsBuffer, bindGroup] = this.createBindGroup(pipeline.vertexStageBindings, [])

      this.vertBindings = {
        stageBindings: pipeline.vertexStageBindings,
        uniformsBuffer,
        bindGroup,
      }

      this.setPropertyValues(GPUShaderStage.VERTEX, pipeline.vertexStageBindings.properties);

      if (vertProperties) {
        this.setPropertyValues(GPUShaderStage.VERTEX, vertProperties);
      }
    }

    if (pipeline.fragmentStageBindings) {
      const [uniformsBuffer, bindGroup] = this.createBindGroup(pipeline.fragmentStageBindings, textures)

      this.fragBindings = {
        stageBindings: pipeline.fragmentStageBindings,
        uniformsBuffer,
        bindGroup,
      }

      this.setPropertyValues(GPUShaderStage.FRAGMENT, pipeline.fragmentStageBindings.properties);

      if (fragProperties) {
        this.setPropertyValues(GPUShaderStage.FRAGMENT, fragProperties);
      }
    }
  }

  static async create(
    drawableType: DrawableType,
    vertexProperties: PropertyInterface[],
    materialDescriptor?: MaterialDescriptor,
  ): Promise<Material> {
    await gpu.ready()
    
    let shaderDescriptor: ShaderDescriptor | undefined

    if (typeof materialDescriptor?.shaderDescriptor === 'number') {
      shaderDescriptor = await shaderManager.getDescriptor(materialDescriptor.shaderDescriptor)
    }
    else {
      shaderDescriptor = materialDescriptor?.shaderDescriptor
    }

    const pipeline = await pipelineManager.getPipeline(drawableType, vertexProperties, shaderDescriptor)

    const textures: GPUTexture[] = [];

    // Find textures in the properties
    if (pipeline.fragmentStageBindings) {
      for (const property of pipeline.fragmentStageBindings.properties) {
        if (property.value.dataType === 'texture2D') {
          let textureId = property.value.value as number;

          if (materialDescriptor?.properties) {
            const prop = materialDescriptor.properties.find((p) => p.name === property.name)

            if (prop && prop.value.dataType === 'texture2D') {
              textureId = prop.value.value as number;
            }
          }

          let flipY = false;

          const response = await Http.get<{ flipY: boolean }>(`/textures/${textureId}`)

          if (response.ok) {
            flipY = (await response.body()).flipY;
          }

          let texturePromise = texturePromises.get(textureId)

          if (!texturePromise) {
            texturePromise = Material.retrieveTexture(textureId, flipY);
            texturePromises.set(textureId, texturePromise)
          }

          const texture = await texturePromise

          textures.push(texture);
        }
      }
    }

    return new Material(
      shaderDescriptor ?? null,
      pipeline,
      textures,
      materialDescriptor?.properties,
      vertexProperties,
    );
  }

  createBindGroup(
    bindings: StageBindings,
    textures: GPUTexture[],
  ): [GPUBuffer | null, GPUBindGroup] {
    let entries: GPUBindGroupEntry[] = [];
    let numBindings = 0;
    let textureIndex = 0

    // Set up the bind group entries for the samplers and textures.
    for (const property of bindings.properties) {
      if (property.value.dataType === 'sampler') {
        entries.push({
          binding: numBindings,
          resource: gpu.device.createSampler(property.value.value as GPUSamplerDescriptor)
        })

        numBindings += 1
      }
      else if (property.value.dataType === 'texture2D') {
        entries.push({
          binding: numBindings, resource: textures[textureIndex].createView(),
        })

        textureIndex += 1
        numBindings += 1
      }
    }

    let uniformsBuffer: GPUBuffer | null = null

    if (bindings.structuredView) {
      uniformsBuffer = gpu.device.createBuffer({
        label: 'uniforms',
        size: bindings.structuredView.arrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });  

      entries = entries.concat(
        { binding: numBindings, resource: { buffer: uniformsBuffer }},
      )
    }

    return [
      uniformsBuffer,
      gpu.device.createBindGroup({
        label: 'material',
        layout: bindings.layout!,
        entries,
      }),
    ]
  }

  static async retrieveTexture(textureId: number, flipY: boolean): Promise<GPUTexture> {
    let texture = downloadedTextures.get(textureId)

    if (!texture) {
      const url = `/textures/${textureId}/file`

      const res = await Http.get(url);

      if (res.ok) {
        const blob = await res.blob();

        try {
          const image = await createImageBitmap(blob, { colorSpaceConversion: 'none' })
          
          texture = gpu.device.createTexture({
            format: 'rgba8unorm',
            size: { width: image.width, height: image.height },
            usage: GPUTextureUsage.TEXTURE_BINDING |
                  GPUTextureUsage.COPY_DST |
                  GPUTextureUsage.RENDER_ATTACHMENT,
          });
      
          gpu.device.queue.copyExternalImageToTexture(
            { source: image, flipY },
            { texture },
            { width: image.width, height: image.height },
          );
  
          downloadedTextures.set(textureId, texture)
        }
        catch (error) {
          console.log(error);
          throw(error);
        }  
      }
      else {
        throw new Error('texture failed to download')
      }
    }

    return texture;
  }
  
  setBindGroups(passEncoder: GPURenderPassEncoder): void {
    if (this.vertBindings) {
      passEncoder.setBindGroup(this.vertBindings.stageBindings.binding, this.vertBindings.bindGroup);
    }

    if (this.fragBindings) {
      passEncoder.setBindGroup(this.fragBindings.stageBindings.binding, this.fragBindings.bindGroup);
    }
  }

  setPropertyValues(stage: GPUShaderStageFlags, properties: PropertyInterface[]): void {
    let bindings: MaterialBindings | null = null

    if (stage === GPUShaderStage.VERTEX) {
      bindings = this.vertBindings
    }

    if (stage === GPUShaderStage.FRAGMENT) {
      bindings = this.fragBindings
    }

    if (bindings?.uniformsBuffer && bindings?.stageBindings.structuredView) {
      let values: Record<string, unknown> = {};

      bindings.stageBindings.properties = properties;

      // Extract the values from the properties and put them into an object
      for (const property of properties) {
        if (property.value.dataType !== 'sampler' && property.value.dataType !== 'texture2D') {
          values = {
            ...values,
            [property.name]: property.value.value,
          }
        }
      }
      
      bindings.stageBindings.structuredView.set(values);
      gpu.device.queue.writeBuffer(bindings.uniformsBuffer, 0, bindings.stageBindings.structuredView.arrayBuffer);  
    }
  }

  updateProperty(stage: GPUShaderStageFlags, name: string, value: ValueType): void {
    let bindings: MaterialBindings | null = null

    if (stage === GPUShaderStage.VERTEX) {
      bindings = this.vertBindings
    }

    if (stage === GPUShaderStage.FRAGMENT) {
      bindings = this.fragBindings
    }

    if (bindings?.uniformsBuffer && bindings?.stageBindings.structuredView) {
      let values: Record<string, unknown> = {};

      values[name] = value

      bindings.stageBindings.structuredView.set(values);
      gpu.device.queue.writeBuffer(bindings.uniformsBuffer, 0, bindings.stageBindings.structuredView.arrayBuffer);  
    }
  }
}

export default Material;
