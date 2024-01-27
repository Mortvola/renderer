import { StructuredView } from "webgpu-utils";
import { bindGroups } from "../BindGroups";
import DrawableInterface from "../Drawables/DrawableInterface";
import { gpu } from "../Gpu";
import { pipelineManager } from "../Pipelines/PipelineManager";
import { DrawableNodeInterface, MaterialInterface, PipelineInterface, maxInstances } from "../types";
import { MaterialDescriptor } from "./MaterialDescriptor";
import { PropertyInterface } from "../ShaderBuilder/Types";

class Material implements MaterialInterface {
  pipeline: PipelineInterface | null = null;

  color = new Float32Array(4);

  uniformsBuffer: GPUBuffer | null = null;

  propertiesStructure: StructuredView | null = null;

  colorBuffer: GPUBuffer;

  textureAttributesBuffer: GPUBuffer | null = null;

  bindGroup: GPUBindGroup;

  drawables: DrawableInterface[] = [];

  transparent: boolean;

  private constructor(
    materialDescriptor: MaterialDescriptor,
    pipeline: PipelineInterface,
    bindGroupLayout: GPUBindGroupLayout | null,
    bitmaps: ImageBitmap[],
    properties: PropertyInterface[],
    propertiesStructure: StructuredView | null,
    fromGraph: boolean,
  ) {
    this.pipeline = pipeline;

    this.transparent = materialDescriptor.transparent ?? false;
    
    if (materialDescriptor.color) {
      this.color[0] = materialDescriptor.color[0];
      this.color[1] = materialDescriptor.color[1];
      this.color[2] = materialDescriptor.color[2];
      this.color[3] = materialDescriptor.color[3];  
    }
    else {
      this.color[0] = 0.8;
      this.color[1] = 0.8;
      this.color[2] = 0.8;
      this.color[3] = 1.0;  
    }

    if (fromGraph) {
      const textures: GPUTexture[] = [];

      for (const bitmap of bitmaps) {
        const texture = gpu.device.createTexture({
          format: 'rgba8unorm',
          size: [bitmap.width, bitmap.height],
          usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
    
        gpu.device.queue.copyExternalImageToTexture(
          { source: bitmap },
          { texture },
          { width: bitmap.width, height: bitmap.height },
        );

        textures.push(texture);
      }
  
      this.colorBuffer = gpu.device.createBuffer({
        label: 'color',
        size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      let entries: GPUBindGroupEntry[] = [];

      let numBindings = 0;

      if (textures.length > 0) {
        entries = [
          { binding: 0, resource: gpu.device.createSampler() },
          ...textures.map((texture, index) => ({
            binding: 1 + index, resource: texture.createView(),
          })),
        ]

        numBindings += 1 + textures.length;
      }

      this.propertiesStructure = propertiesStructure;

      if (this.propertiesStructure) {
        this.uniformsBuffer = gpu.device.createBuffer({
          label: 'uniforms',
          size: this.propertiesStructure.arrayBuffer.byteLength,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });  

        entries = entries.concat(
          { binding: numBindings, resource: { buffer: this.uniformsBuffer }},
        )
      }

      this.setPropertyValues(properties);

      this.bindGroup = gpu.device.createBindGroup({
        label: 'material',
        layout: bindGroupLayout ?? bindGroups.getBindGroupLayout2(),
        entries,
      });
    }
    else {
      this.colorBuffer = gpu.device.createBuffer({
        label: 'color',
        size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.bindGroup = gpu.device.createBindGroup({
        label: 'Color',
        layout: bindGroups.getBindGroupLayout2A(),
        entries: [
          { binding: 0, resource: { buffer: this.colorBuffer }},
        ],
      });
    }
  }

  static async create(materialDescriptor: MaterialDescriptor): Promise<Material> {
    const [pipeline, bindGroupLayout, properties, propertiesStructure, fromGraph] = pipelineManager.getPipelineByArgs(materialDescriptor)

    let bitmap: ImageBitmap[] = [];

    // Find textures in the properties
    for (const property of properties) {
      if (property.value.dataType === 'texture2D') {
        let url: string;

        if (typeof property.value.value === 'string') {
          url = property.value.value;
        }
        else if (typeof property.value.value === 'number') {
          url = `/textures/${property.value.value}`
        }
        else {
          throw new Error('texture value is unknown type')
        }

        const res = await fetch(url);

        if (res.ok) {
          const blob = await res.blob();
          try {
            bitmap.push(await createImageBitmap(blob, { colorSpaceConversion: 'none' }));  
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
    }

    return new Material(materialDescriptor, pipeline, bindGroupLayout, bitmap, properties, propertiesStructure, fromGraph);
  }

  setPropertyValues(properties: PropertyInterface[]) {
    if (this.uniformsBuffer && this.propertiesStructure) {
      let values: Record<string, unknown> = {};

      for (const property of properties) {
        if (property.value.dataType !== 'sampler' && property.value.dataType !== 'texture2D') {
          values = {
            ...values,
            [property.name]: property.value.value,
          }
        }
      }
  
      this.propertiesStructure.set(values);
      gpu.device.queue.writeBuffer(this.uniformsBuffer, 0, this.propertiesStructure.arrayBuffer);  
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
