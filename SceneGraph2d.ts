import { Mat3, mat3, vec2 } from "wgpu-matrix";
import Mesh2D from "./Drawables/Mesh2D";
import SceneNode2d from "./Drawables/SceneNodes/SceneNode2d";
import Material from "./Materials/Material";
import { MaterialInterface, PipelineInterface, maxInstances } from "./types";
import { gpu } from "./Gpu";
import { isTextBox } from "./Drawables/SceneNodes/TextBox";

const defaultMaterial = await Material.create('Mesh2D', [])

type MapEntry = {
  firstIndex: number,
  baseVertex: number,
  instance: {
    transform: Mat3,
    color: number[],
    material: MaterialInterface,
  }[],
}

type MeshInfo = {
  firstInstance: number,
  instanceCount: number,
  firstIndex: number,
  indexCount: number,
  baseVertex: number,
}

type PipelineEntry = {
  pipeline: PipelineInterface,
  materials: Map<
    MaterialInterface,
    Map<Mesh2D, MeshInfo>
  >,
}

class SceneGraph2D {

  scene2d = new SceneNode2d();

  private width: number = 0;

  private height: number = 0;

  private scaleX: number = 1;

  private scaleY: number = 1;

  meshes: Map<Mesh2D, MapEntry> = new Map()

  elementMesh: Mesh2D

  needsUpdate = true

  vertexBuffer: GPUBuffer | null = null;

  texcoordBuffer: GPUBuffer | null = null;

  indexBuffer: GPUBuffer | null = null;

  indexFormat: GPUIndexFormat = "uint16";

  instanceTransform: Float32Array = new Float32Array(4 * maxInstances);

  instanceColor: Float32Array = new Float32Array(4 * maxInstances);

  transformsBuffer: GPUBuffer

  colorsBuffer: GPUBuffer

  bindGroup: GPUBindGroup

  numInstances = 0

  pipelines: PipelineEntry[] = [];

  transparentPipelines: PipelineEntry[] = [];

  clipTransform = mat3.identity();

  constructor() {
    this.elementMesh = SceneGraph2D.allocateBaseElement()

    this.transformsBuffer = gpu.device.createBuffer({
      label: 'model Matrix',
      size: 16 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.colorsBuffer = gpu.device.createBuffer({
      label: 'instance color',
      size: 4 * Float32Array.BYTES_PER_ELEMENT * maxInstances,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'dimension layout',
      entries: [
        { // dimensions
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        { // Instance color
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
      ]
    });

    this.bindGroup = gpu.device.createBindGroup({
      label: 'bind group for 2D instances',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.transformsBuffer }},
        { binding: 1, resource: { buffer: this.colorsBuffer }},
      ],
    });
  }

  static allocateBaseElement() {
    const vertices: number[] = [];
    const texcoords: number[] = [];
    const indexes: number[] = [];

    vertices.push(0, 0)
    vertices.push(0, 1)
    vertices.push(1, 1)
    vertices.push(1, 0)

    texcoords.push(0, 0)
    texcoords.push(0, 1)
    texcoords.push(1, 1)
    texcoords.push(1, 0)
    
    indexes.push(0, 1, 3, 3, 1, 2)

    return new Mesh2D(vertices, texcoords, indexes, 1, 1)
  }

  setCanvasDimensions(width: number, height: number, scaleX?: number, scaleY?: number) {
    this.width = width
    this.height = height

    if (scaleX) {
      this.scaleX = scaleX;
    }

    if (scaleY) {
      this.scaleY = scaleY;
    }

    this.clipTransform = mat3.identity()
    
    // mat3.translate(this.clipTransform, vec2.create(-1, 1), this.clipTransform)
    mat3.scale(this.clipTransform, vec2.create(1 / this.width * 2 * this.scaleX, 1 / this.height * 2 * -this.scaleY), this.clipTransform)

    this.needsUpdate = true
  }

  addNode(node: SceneNode2d) {
    this.scene2d.nodes.push(node)

    this.needsUpdate = true
  }

  private getElementDimension(dimension: number | string, canvasDimension: number) {
    let dim = 0;

    if (typeof dimension === 'number') {
      dim = dimension
    }
    else {
      const result = /([0-9]+)%/.exec(dimension)

      if (result) {
        dim = parseFloat(result[1]) * canvasDimension * 4
      }
    }

    return dim;
  }

  async updateLayout() {
    if (this.width === 0 || this.height === 0 || !this.needsUpdate) {
      return
    }

    this.meshes = new Map()

    this.numInstances = 0

    await this.layoutELements(this.scene2d)

    this.allocateBuffers()

    this.addInstances()

    this.needsUpdate = false;
  }

  private async layoutELements(
    element: SceneNode2d,
    x?: number,
    y?: number,
    parentWidth?: number,
    parentHeight?: number,
    parentColor?: number[],
  ): Promise<[number, number]> {
    let left = (x ?? 0) + (element.style.margin?.left ?? 0);
    let top = (y ?? 0) + (element.style.margin?.top ?? 0);

    if (element.style.position === 'absolute') {
      left = element.style.x ?? 0;
      top = element.style.y ?? 0;
    }

    let maxWidth: number | undefined = undefined
    let maxHeight: number | undefined = undefined

    if (element.style.width) {
      maxWidth = this.getElementDimension(element.style.width, this.width)
    }

    if (element.style.height) {
      maxHeight = this.getElementDimension(element.style.height, this.height)
    }

    let childrenWidth = 0;
    let childrenHeight = 0;
    let childLeft = left + (element.style.border?.width ?? 0);
    let childTop = top + (element.style.border?.width ?? 0);

    for (const node of element.nodes) {
      const [childWidth, childHeight] = await this.layoutELements(node, childLeft, childTop, maxWidth, maxHeight, element.style.color)

      childrenWidth += childWidth;
      childrenHeight = Math.max(childrenHeight, childHeight);

      childLeft += childWidth;
    }

    const [width, height] = await this.addElement(
      element, left, top, childrenWidth, childrenHeight, maxWidth, maxHeight, parentWidth, parentHeight, parentColor,
    )

    return [
      width + (element.style.margin?.left ?? 0) + (element.style.margin?.right ?? 0),
      height + (element.style.margin?.top ?? 0) + (element.style.margin?.bottom ?? 0),
    ]
  }

  private async addElement(
    element: SceneNode2d,
    x: number,
    y: number,
    childWidth: number,
    childHeight: number,
    maxWidth?: number,
    maxHeight?: number,
    parentWidth?: number,
    parentHeight?: number,
    parentColor?: number[],
  ): Promise<[number, number]> {
    let material: MaterialInterface = defaultMaterial

    let width = maxWidth ?? childWidth
    let height = maxHeight ?? childHeight

    if (isTextBox(element)) {
      const mesh = await element.createMesh(parentWidth)

      if (element.material) {
        material = element.material
      }
  
      width = mesh.width
      height = mesh.height

      let entry = this.meshes.get(mesh)

      if (!entry) {
        entry = { firstIndex: 0, baseVertex: 0, instance: [] }
      }

      const transform = mat3.identity()
      mat3.translate(transform, vec2.create(x, y), transform)

      // Text elements inherit the color of their parent.
      entry.instance.push({ transform: mat3.multiply(this.clipTransform, transform), color: parentColor ?? [1, 1, 1, 1], material })

      this.meshes.set(mesh, entry)
    }
    else if (element.material || element.style.backgroundColor) {
      if (element.material) {
        material = element.material
      }
  
      let dimensions = {
        x,
        y,
        width,
        height,
      }

      if (element.style.border) {
        dimensions.x += element.style.border.width
        dimensions.y += element.style.border.width
        dimensions.width -= element.style.border.width * 2
        dimensions.height -= element.style.border.width * 2
      }

      const transform = mat3.identity()
      mat3.translate(transform, vec2.create(dimensions.x, dimensions.y), transform)
      mat3.scale(transform, vec2.create(dimensions.width, dimensions.height), transform)

      let entry = this.meshes.get(this.elementMesh)

      if (!entry) {
        entry = { firstIndex: 0, baseVertex: 0, instance: [] }
      }

      entry.instance.push({ transform: mat3.multiply(this.clipTransform, transform), color: element.style.backgroundColor ?? [1, 1, 1, 1], material })

      if (element.style.border) {
        let dimensions = {
          x,
          y,
          width,
          height,
        }
  
        const transform = mat3.identity()
        mat3.translate(transform, vec2.create(dimensions.x, dimensions.y), transform)
        mat3.scale(transform, vec2.create(dimensions.width, dimensions.height), transform)

        entry.instance.push({ transform: mat3.multiply(this.clipTransform, transform), color: element.style.border.color, material: defaultMaterial })
      }

      this.meshes.set(this.elementMesh, entry)
    }

    return [width, height]
  }

  private addInstances() {
    this.pipelines = [];
    this.transparentPipelines = [];

    for (const [mesh, meshInfo] of this.meshes) {
      for (const instance of meshInfo.instance) {
        if (instance.material.pipeline) {
          let pipelineEntry: PipelineEntry | null = null

          if (instance.material.transparent) {
            pipelineEntry = this.transparentPipelines.find((p) => p.pipeline === instance.material.pipeline) ?? null;

            if (!pipelineEntry) {
              pipelineEntry = { pipeline: instance.material.pipeline, materials: new Map() }
  
              this.transparentPipelines.push(pipelineEntry);
            }  
          }
          else {
            pipelineEntry = this.pipelines.find((p) => p.pipeline === instance.material.pipeline) ?? null;

            if (!pipelineEntry) {
              pipelineEntry = { pipeline: instance.material.pipeline, materials: new Map() }
  
              this.pipelines.push(pipelineEntry);
            }  
          }
      
          if (pipelineEntry) {
            let meshMap = pipelineEntry.materials.get(instance.material);

            if (!meshMap) {
              const instances: MeshInfo = {
                instanceCount: 1,
                firstIndex: meshInfo.firstIndex,
                indexCount: mesh.indices.length,
                baseVertex: meshInfo.baseVertex,
                firstInstance: this.numInstances,
              }

              meshMap = new Map()

              meshMap.set(mesh, instances)

              pipelineEntry.materials.set(instance.material, meshMap)            
            }
            else {
              let instances = meshMap.get(mesh)

              if (!instances) {
                instances = {
                  instanceCount: 0,
                  firstIndex: meshInfo.firstIndex,
                  indexCount: mesh.indices.length,
                  baseVertex: meshInfo.baseVertex,
                  firstInstance: this.numInstances,
                }
  
                meshMap.set(mesh, instances)
              }

              instances.instanceCount += 1
            }

            this.instanceTransform[this.numInstances * 12 + 0] = instance.transform[0];
            this.instanceTransform[this.numInstances * 12 + 1] = instance.transform[1];
            this.instanceTransform[this.numInstances * 12 + 2] = instance.transform[2];

            this.instanceTransform[this.numInstances * 12 + 4] = instance.transform[4];
            this.instanceTransform[this.numInstances * 12 + 5] = instance.transform[5];
            this.instanceTransform[this.numInstances * 12 + 6] = instance.transform[6];

            this.instanceTransform[this.numInstances * 12 + 8] = instance.transform[8];
            this.instanceTransform[this.numInstances * 12 + 9] = instance.transform[9];
            this.instanceTransform[this.numInstances * 12 + 10] = instance.transform[10];

            this.instanceColor[this.numInstances * 4 + 0] = instance.color[0]
            this.instanceColor[this.numInstances * 4 + 1] = instance.color[1]
            this.instanceColor[this.numInstances * 4 + 2] = instance.color[2]
            this.instanceColor[this.numInstances * 4 + 3] = instance.color[3]
        
            this.numInstances += 1
          }  
        }
      }
    }

    gpu.device.queue.writeBuffer(this.transformsBuffer, 0, this.instanceTransform, 0, this.numInstances * 16);  
    gpu.device.queue.writeBuffer(this.colorsBuffer, 0, this.instanceColor, 0, this.numInstances * 4);  
  }

  private allocateBuffers() {
    let verticesLength = 0;
    let texcoordLength = 0;
    let indicesLength = 0;

    for (const [m] of this.meshes) {
      verticesLength += m.vertices.length
      texcoordLength += m.texcoord.length
      indicesLength += m.indices.length
    }

    this.vertexBuffer = gpu.device.createBuffer({
      size: verticesLength * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    {
      const mapping = new Float32Array(this.vertexBuffer.getMappedRange());

      let offset = 0;
      for (const [m, i] of this.meshes) {
        i.baseVertex = offset / 2
        mapping.set(m.vertices, offset);
        offset += m.vertices.length
      }

      this.vertexBuffer.unmap();  
    }

    this.texcoordBuffer = gpu.device.createBuffer({
      size: texcoordLength * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });  

    {
      const mapping = new Float32Array(this.texcoordBuffer.getMappedRange());

      let offset = 0;
      for (const [m] of this.meshes) {
        mapping.set(m.texcoord, offset);
        offset += m.texcoord.length
      }

      this.texcoordBuffer.unmap();  
    }

    if (indicesLength > 0xFFFF) {
      this.indexFormat = "uint32";

      this.indexBuffer = gpu.device.createBuffer({
        size: (indicesLength * Uint32Array.BYTES_PER_ELEMENT + 3) & ~3, // Make sure it is a multiple of four
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
      })
  
      {
        const mapping = new Uint32Array(this.indexBuffer.getMappedRange());

        let offset = 0;
        for (const [m, i] of this.meshes) {
          i.firstIndex = offset
          mapping.set(m.indices, offset);
          offset += m.indices.length
        }
  
        this.indexBuffer.unmap();  
      }  
    }
    else {
      this.indexFormat = "uint16";

      this.indexBuffer = gpu.device.createBuffer({
        size: (indicesLength * Uint16Array.BYTES_PER_ELEMENT + 3) & ~3, // Make sure it is a multiple of four
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
      })
  
      {
        const mapping = new Uint16Array(this.indexBuffer.getMappedRange());

        let offset = 0;
        for (const [m, i] of this.meshes) {
          i.firstIndex = offset
          mapping.set(m.indices, offset);
          offset += m.indices.length
        }
  
        this.indexBuffer.unmap();  
      }  
    }
  }
}

export default SceneGraph2D
