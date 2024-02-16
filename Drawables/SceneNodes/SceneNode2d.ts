import { mat4, vec3, Vec4, Mat4, quat, Quat } from 'wgpu-matrix';
import { getEulerAngles } from '../../Math';
import { MaterialInterface } from '../../types';

export const rotationOrder: quat.RotationOrder = 'xyz';

class SceneNode2d {
  name = '';

  x = -1;

  y = 1;

  width = 2;

  height = 2;

  material: MaterialInterface | null = null

  nodes: SceneNode2d[] = []

  addInstanceInfo() {
    
  }
}

export default SceneNode2d;
