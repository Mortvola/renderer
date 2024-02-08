import { Vec4, mat4, vec3, vec4 } from "wgpu-matrix"
import { ContainerNodeInterface, ParticleDescriptor, ParticleSystemInterface } from "./types";
import DrawableNode from "./Drawables/SceneNodes/DrawableNode";
import { degToRad } from "./Math";
import DrawableInterface from "./Drawables/DrawableInterface";
import Billboard from "./Drawables/Billboard";
import { MaterialDescriptor } from "./Materials/MaterialDescriptor";
import { materialManager } from "./Materials/MaterialManager";

type Point = {
  velocity: number,
  direction: Vec4,
  lifetime: number,
  drawable: DrawableNode,
  size: number,
  sizeChangeRate: number,
  color: Vec4,
}

class ParticleSystem implements ParticleSystemInterface {
  id: number

  points: Point[] = []

  maxPoints: number

  rate: number

  lastEmitTime = 0;

  minLifetime: number;
  maxLifetime: number;

  angle: number;

  initialVelocity: number;

  initialeSize: number;

  finalSize: number;

  originRadius: number;

  initialColor: number[][];

  materialId: number | undefined = undefined;

  materialDescriptor: MaterialDescriptor | undefined;

  drawable: DrawableInterface | null = null;

  private constructor(id: number, materialDescriptor?: MaterialDescriptor, descriptor?: ParticleDescriptor) {
    this.id = id

    this.rate = descriptor?.rate ?? 10
    this.maxPoints = descriptor?.maxPoints ?? 50
    this.minLifetime = descriptor?.lifetime ? descriptor.lifetime[0] : 1
    this.maxLifetime = descriptor?.lifetime ? descriptor.lifetime[1] : 5
    this.angle = descriptor?.angle ?? 25
    this.initialVelocity = descriptor?.initialVelocity ?? 5
    this.originRadius = descriptor?.originRadius ?? 1
    this.initialeSize = descriptor?.initialSize ?? 1;
    this.finalSize = descriptor?.finalSize ?? this.initialeSize;
    this.initialColor = descriptor?.initialColor ?? [[1, 1, 1, 1], [1, 1, 1, 1]]
    this.materialId = descriptor?.materialId
    this.materialDescriptor = materialDescriptor
  }

  static async create(id: number, descriptor?: ParticleDescriptor) {
    let materialDescriptor: MaterialDescriptor | undefined = undefined
    if (descriptor?.materialId) {
      materialDescriptor = await materialManager.getDescriptor(descriptor.materialId)
    }

    return new ParticleSystem(id, materialDescriptor, descriptor)
  }

  async update(time: number, elapsedTime: number, scene: ContainerNodeInterface): Promise<void> {
    if (this.lastEmitTime === 0) {
      this.lastEmitTime = time;
      return
    }

    // Update existing particles
    for (let i = 0; i < this.points.length; i +=1) {
      const point = this.points[i];
      point.lifetime -= elapsedTime;

      if (point.lifetime <= 0) {
        scene.removeNode(point.drawable);
        
        this.points = [
          ...this.points.slice(0, i),
          ...this.points.slice(i + 1),
        ]

        i -= 1

        continue
      }

      point.drawable.translate = vec3.addScaled(point.drawable.translate, point.direction, point.velocity * elapsedTime);
      point.size += point.sizeChangeRate * elapsedTime;
      point.drawable.scale = vec3.create(point.size, point.size, point.size)

      point.drawable.color[0] = point.color[0];
      point.drawable.color[1] = point.color[1];
      point.drawable.color[2] = point.color[2];
      point.drawable.color[3] = point.color[3];
    }

    // Add new particles
    await this.emit(time, elapsedTime, scene)
  }

  private async emit(time: number, elapsedTime: number, scene: ContainerNodeInterface) {
    if (!this.drawable) {
      this.drawable = new Billboard()
    }

    if (this.points.length < this.maxPoints) {
      const emitElapsedTime = time - this.lastEmitTime;

      let numToEmit = Math.min(Math.trunc((this.rate / 1000) * emitElapsedTime), this.maxPoints - this.points.length);

      if (numToEmit > 0) {
        this.lastEmitTime = time;
      
        // while (this.points.length < this.maxPoints) {
        for (; numToEmit > 0; numToEmit -= 1) {
          const drawable = await DrawableNode.create(this.drawable, this.materialDescriptor?.shaderDescriptor);
    
          let origin = vec4.create(0, 0, 0, 1)

          // const offset = Math.random() * this.originRadius;
          const offset = this.originRadius;
          const rotate = degToRad(Math.random() * 360);

          let transform = mat4.identity()
          mat4.rotateY(transform, rotate, transform)
          mat4.translate(transform, vec4.create(0, 0, offset, 1), transform)
          vec4.transformMat4(origin, transform, origin)

          drawable.translate = origin
          drawable.scale = vec3.create(this.initialeSize, this.initialeSize, this.initialeSize);

          scene.addNode(drawable)
    
          // const vector = vec4.create(0, 1, 0, 0)

          // transform = mat4.identity()
          // mat4.rotateY(transform, degToRad(Math.random() * 360), transform)
          // mat4.rotateX(transform, degToRad(this.angle), transform)
          // vec4.transformMat4(vector, transform, vector)

          const p1 = vec4.create(0, 1, 0, 1);

          transform = mat4.identity()
          mat4.rotateY(transform, rotate, transform)
          mat4.translate(transform, vec4.create(0, 0, offset, 1), transform)
          mat4.rotateX(transform, degToRad(this.angle), transform)
          vec4.transformMat4(p1, transform, p1)

          const vector = vec4.subtract(p1, origin)

          // console.log(`angle: ${vec3.angle(vec3.create(0, 1, 0), vector)}`)

          const lifetime = (this.maxLifetime - this.minLifetime) * Math.random() + this.minLifetime;
          const sizeChangeRate = (this.finalSize - this.initialeSize) / lifetime;

          const computeRandomColor = (color1: number[], color2: number[]) => {
            return [
              Math.random() * (color2[0] - color1[0]) + color1[0],
              Math.random() * (color2[1] - color1[1]) + color1[1],
              Math.random() * (color2[2] - color1[2]) + color1[2],
              1,
            ]
          }

          const point = {
            velocity: this.initialVelocity,
            direction: vector,
            lifetime,
            drawable,
            size: this.initialeSize,
            sizeChangeRate,
            color: computeRandomColor(this.initialColor[0], this.initialColor[1]),
          }
    
          this.points.push(point)
        }
      }
    }
  }

  removePoints(scene: ContainerNodeInterface): void {
    for (const point of this.points) {
      scene.removeNode(point.drawable)
    }
  }

  getDescriptor(): ParticleDescriptor {
    return ({
      maxPoints: this.maxPoints,
      rate: this.rate,
      angle: this.angle,
      originRadius: this.originRadius,
      initialVelocity: this.initialVelocity,
      lifetime: [this.minLifetime, this.maxLifetime],
      initialSize: this.initialeSize,
      finalSize: this.finalSize,
      initialColor: this.initialColor,
      materialId: this.materialId,
    })
  }
}

export default ParticleSystem
