import { vec4, mat4, quat, Vec4, Mat4 } from 'wgpu-matrix';
import { normalizeDegrees, degToRad } from './Math';

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

  near = 0.125;
  
  far = 2000;

  moveDirection = vec4.create(0, 0, 0, 0);

  currentVelocity = vec4.create(0, 0, 0, 0);

  maxVelocity = 10;

  moveCameraTo: Vec4 | null = null;

  moveCameraStartTime: number | null = null;

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

  changeRotation(deltaX: number) {
    this.rotateY = normalizeDegrees(this.rotateY + deltaX);

    this.computeViewTransform();
  }

  computeViewTransform() {
    this.viewTransform = mat4.identity();

    const cameraQuat = quat.fromEuler(degToRad(this.rotateX), degToRad(this.rotateY), degToRad(0), "zyx");
    const t = mat4.fromQuat(cameraQuat);
    
    const translate1 = mat4.translation(this.position);
    const translate2 = mat4.translation(vec4.create(0, 0, this.offset));

    mat4.multiply(this.viewTransform, translate1, this.viewTransform)
    mat4.multiply(this.viewTransform, t, this.viewTransform)
    mat4.multiply(this.viewTransform, translate2, this.viewTransform)

    this.updateListener();
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
