import { vec4, mat4, quat, Vec4, Mat4, vec3 } from 'wgpu-matrix';
import { normalizeDegrees, degToRad, radToDeg } from './Math';

export type ProjectionType = 'Perspective' | 'Orthographic';

class Camera {
  projection: ProjectionType = 'Perspective';

  perspectiveTransform = mat4.identity();

  orthographicTransform = mat4.identity();

  viewTransform = mat4.identity();

  offset = 5;

  position = vec4.create(0, 0, 0, 1);

  rotateX = -35;

  rotateY = 0;

  finalRotateY = 0;

  near = 0.125;
  
  far = 2000;

  moveDirection = vec4.create(0, 0, 0, 0);

  currentVelocity = vec4.create(0, 0, 0, 0);

  maxVelocity = 10;

  rotationPoint = vec4.create(0, 0, 0, 1);

  finalTranslate = vec3.create(0, 0, 0)

  moveCameraTo: Vec4 | null = null;

  moveCameraStartTime: number | null = null;

  updateRotation = false

  constructor(offset?: number, position?: Vec4) {
    if (offset) {
      this.offset = offset;
    }

    if (position) {
      this.position = position;
    }
  }

  updatePosition(elapsedTime: number, timestamp: number) {
    if (this.moveCameraTo !== null && this.moveCameraStartTime === null) {
      this.moveCameraStartTime = timestamp;
    }
  
    const cameraQuat = quat.fromEuler(degToRad(0), degToRad(this.rotateY), degToRad(0), "yxz");
    const rotationMatrix = mat4.fromQuat(cameraQuat);

    const deltaVector = vec4.subtract(vec4.mulScalar(this.moveDirection, this.maxVelocity), this.currentVelocity);

    // const direction = vec4.mulScalar(this.moveDirection, elapsedTime * this.maxVelocity);
    this.currentVelocity = vec4.add(this.currentVelocity, vec4.mulScalar(deltaVector, elapsedTime * 10));

    const change = vec4.mulScalar(this.currentVelocity, elapsedTime);

    const direction = vec4.transformMat4(change, rotationMatrix)

    this.position[0] += direction[0];
    this.position[2] += direction[2];

    if (this.moveCameraTo) {
      const direction = vec4.normalize(vec4.subtract(this.moveCameraTo, this.position));

      const change = vec4.mulScalar(direction, elapsedTime * 30);

      this.position[0] += change[0];
      this.position[2] += change[2];

      if (this.moveCameraStartTime === null || timestamp - this.moveCameraStartTime > 2000) {
        this.moveCameraTo = null;
      } 
    }

    this.computeViewTransform();
  }

  computeRotationInfo() {
    const p1 = vec4.transformMat4(vec4.create(0, 0, 0, 1), this.viewTransform)

    const transform = mat4.identity()
    mat4.translate(transform, this.finalTranslate, transform)
    mat4.rotateY(transform, degToRad(this.finalRotateY), transform)
    mat4.translate(transform, vec3.negate(this.finalTranslate), transform)
    mat4.translate(transform, this.position, transform)

    const p2 = vec4.transformMat4(vec4.create(0, 0, 0, 1), transform)

    const v1 = vec3.subtract(p1, p2)
    v1[1] = 0
    vec3.normalize(v1, v1)

    const angle = normalizeDegrees(radToDeg(Math.atan2(v1[0], v1[2])))

    this.position = p2;
    this.finalRotateY = 0;
    this.rotateY = angle
    this.finalTranslate = this.rotationPoint.slice()
  }

  setRotatePoint(point: Vec4) {
    this.rotationPoint = point.slice()
    this.updateRotation = true
  }

  changeRotation(deltaX: number, deltaY: number) {
    if (this.updateRotation) {
      this.computeRotationInfo()
      this.updateRotation = false
    }

    this.finalRotateY = normalizeDegrees(this.finalRotateY + deltaX);
    this.rotateX = normalizeDegrees(this.rotateX + deltaY);

    this.computeViewTransform();
  }

  computeViewTransform() {
    this.viewTransform = mat4.identity()

    mat4.translate(this.viewTransform, this.finalTranslate, this.viewTransform)
    mat4.rotateY(this.viewTransform, degToRad(this.finalRotateY), this.viewTransform)
    mat4.translate(this.viewTransform, vec3.negate(this.finalTranslate), this.viewTransform)

    mat4.translate(this.viewTransform, this.position, this.viewTransform)
    mat4.rotateY(this.viewTransform, degToRad(this.rotateY), this.viewTransform)
    mat4.rotateX(this.viewTransform, degToRad(this.rotateX), this.viewTransform)
    mat4.translate(this.viewTransform, vec4.create(0, 0, this.offset, 1), this.viewTransform)

    // this.updateListener();
  }

  changeOffset(delta: number) {
    this.offset *= (1 + (delta / 16));

    this.computeViewTransform();
  }

  updateListener() {
    // const listener = audioContext.listener;

    // const listenerPosition = vec4.transformMat4(
    //   vec4.create(0, 0, 0, 1),
    //   this.viewTransform,
    // )

    // listener.positionX.value = listenerPosition[0];
    // listener.positionY.value = listenerPosition[1];
    // listener.positionZ.value = listenerPosition[2];

    // const listenerOrientation = vec4.transformMat4(
    //   vec4.create(0, 0, -1, 0),
    //   this.viewTransform,
    // )

    // listener.forwardX.value = listenerOrientation[0];
    // listener.forwardY.value = listenerOrientation[1];
    // listener.forwardZ.value = listenerOrientation[2];

    // listener.upX.value = 0;
    // listener.upY.value = 1;
    // listener.upZ.value = 0;
  }

  ndcToCameraSpace(x: number, y: number) {
    let inverseMatrix: Mat4;
    if (this.projection === 'Perspective') {
      inverseMatrix = mat4.inverse(this.perspectiveTransform);
    }
    else {
      inverseMatrix = mat4.inverse(this.orthographicTransform);
    }

    // Transform point from NDC to camera space.
    let point = vec4.create(x, y, 0, 1);
    point = vec4.transformMat4(point, inverseMatrix);
    point = vec4.divScalar(point, point[3])

    return point;
  }

  // Returns ray and origin in world space coordinates.
  computeHitTestRay(x: number, y: number): { ray: Vec4, origin: Vec4 } {
    let point = this.ndcToCameraSpace(x, y);
  
    // Transform point and camera to world space.
    point = vec4.transformMat4(point, this.viewTransform)
    const origin = vec4.transformMat4(vec4.create(0, 0, 0, 1), this.viewTransform);

    // Compute ray from camera through point
    let ray = vec4.subtract(point, origin);
    ray[3] = 0;
    ray = vec4.normalize(ray);

    return ({
      ray,
      origin,
    })
  }  
}

export default Camera;
