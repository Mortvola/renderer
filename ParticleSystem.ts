import { Vec4, mat4, vec3, vec4 } from "wgpu-matrix"
import { ContainerNodeInterface, ParticleSystemInterface } from "./types";
import Mesh from "./Drawables/Mesh";
import { plane } from "./Drawables/Shapes/plane";
import DrawableNode from "./Drawables/SceneNodes/DrawableNode";
import { litMaterial } from "./Materials/Lit";
import { degToRad } from "./Math";
import { ParticleDescriptor } from "../State/types";

type Point = {
  velocity: number,
  direction: Vec4,
  lifetime: number,
  drawable: DrawableNode,
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

  originRadius: number;

  mesh: Mesh | null = null;

  constructor(id: number, descriptor?: ParticleDescriptor) {
    this.id = id

    this.rate = descriptor?.rate ?? 10
    this.maxPoints = descriptor?.maxPoints ?? 50
    this.minLifetime = descriptor?.lifetime ? descriptor.lifetime[0] : 1
    this.maxLifetime = descriptor?.lifetime ? descriptor.lifetime[1] : 5
    this.angle = descriptor?.angle ?? 25
    this.initialVelocity = descriptor?.initialVelocity ?? 5
    this.originRadius = descriptor?.originRadius ?? 1
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
    }

    if (!this.mesh) {
      this.mesh = await Mesh.create(plane(0.125, 0.125, vec4.create(1, 1, 1, 1)))
    }

    // Add new particles
    if (this.points.length < this.maxPoints) {
      const emitElapsedTime = time - this.lastEmitTime;

      let numToEmit = Math.min(Math.trunc((this.rate / 1000) * emitElapsedTime), this.maxPoints - this.points.length);

      if (numToEmit > 0) {
        this.lastEmitTime = time;
      
        // while (this.points.length < this.maxPoints) {
        for (; numToEmit > 0; numToEmit -= 1) {
          const drawable = await DrawableNode.create(this.mesh, litMaterial);
    
          let origin = vec4.create(0, 0, 0, 1)

          // const offset = Math.random() * this.originRadius;
          const offset = this.originRadius;
          const rotate = degToRad(Math.random() * 360);

          let transform = mat4.identity()
          mat4.rotateY(transform, rotate, transform)
          mat4.translate(transform, vec4.create(0, 0, offset, 1), transform)
          vec4.transformMat4(origin, transform, origin)

          drawable.translate = origin

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

          const point = {
            velocity: this.initialVelocity,
            direction: vector,
            lifetime: (this.maxLifetime - this.minLifetime) * Math.random() + this.minLifetime,
            drawable,
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
    })
  }
}

export default ParticleSystem