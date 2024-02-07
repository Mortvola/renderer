import { bindGroups } from "../BindGroups";
import DrawableInterface from "../Drawables/DrawableInterface";
import { gpu } from "../Gpu";
import { pipelineManager } from "../Pipelines/PipelineManager";
import { DrawableNodeInterface, DrawableType, MaterialInterface, PipelineInterface, StageBindings } from "../types";
import { ShaderDescriptor } from "../shaders/ShaderDescriptor";
import { PropertyInterface, ValueType } from "../ShaderBuilder/Types";
import Http from "../../Http/src";

const downloadedTextures: Map<number, GPUTexture> = new Map();

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

  drawables: DrawableInterface[] = [];

  transparent: boolean;

  private constructor(
    materialDescriptor: ShaderDescriptor | null,
    pipeline: PipelineInterface,
    vertStageBindings: StageBindings | null,
    fragStageBindings: StageBindings | null,
    textures: GPUTexture[],
    fromGraph: boolean,
  ) {
    this.pipeline = pipeline;
    
    this.color[0] = materialDescriptor?.color ? materialDescriptor.color[0] : 0.5;
    this.color[1] = materialDescriptor?.color ? materialDescriptor.color[1] : 0.5;
    this.color[2] = materialDescriptor?.color ? materialDescriptor.color[2] : 0.5;
    this.color[3] = materialDescriptor?.color ? materialDescriptor.color[3] : 1;
    
    this.transparent = materialDescriptor?.transparent ?? false;

    if (fromGraph) {
      if (vertStageBindings) {
        const [uniformsBuffer, bindGroup] = this.createBindGroup(vertStageBindings, [])

        this.vertBindings = {
          stageBindings: vertStageBindings,
          uniformsBuffer,
          bindGroup,
        }

        this.setPropertyValues(GPUShaderStage.VERTEX, vertStageBindings.properties);  
      }

      if (fragStageBindings) {
        const [uniformsBuffer, bindGroup] = this.createBindGroup(fragStageBindings, textures)

        this.fragBindings = {
          stageBindings: fragStageBindings,
          uniformsBuffer,
          bindGroup,
        }

        this.setPropertyValues(GPUShaderStage.FRAGMENT, fragStageBindings.properties);  
      }
    }
  }

  static async create(
    drawableType: DrawableType,
    vertexProperties: PropertyInterface[],
    materialDescriptor?: ShaderDescriptor,
  ): Promise<Material> {
    const [
      pipeline, vertStageBindings, fragStageBindings, fromGraph,
    ] = pipelineManager.getPipeline(drawableType, vertexProperties, materialDescriptor)

    const textures: GPUTexture[] = [];

    // Find textures in the properties
    if (fragStageBindings) {
      for (const property of fragStageBindings.properties) {
        if (property.value.dataType === 'texture2D') {
          const textureId = property.value.value as number;

          let flipY = false;

          const response = await Http.get<{ flipY: boolean }>(`/textures/${textureId}`)

          if (response.ok) {
            flipY = (await response.body()).flipY;
          }

          const texture = await Material.retrieveTexture(textureId, flipY);

          textures.push(texture);
        }
      }
    }

    return new Material(
      materialDescriptor ?? null,
      pipeline,
      vertStageBindings,
      fragStageBindings,
      textures,
      fromGraph,
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
        layout: bindings.layout ?? bindGroups.getBindGroupLayout2(),
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
            size: [image.width, image.height],
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

  setPropertyValues(stage: GPUShaderStageFlags, properties: PropertyInterface[]) {
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

  addDrawable(drawableNode: DrawableNodeInterface): void {
    let entry = this.drawables.find((d) => d === drawableNode.drawable);

    if (!entry) {
      this.drawables.push(drawableNode.drawable);
    }
  }
}

export default Material;
