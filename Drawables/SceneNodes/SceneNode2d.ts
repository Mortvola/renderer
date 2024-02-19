import { mat3 } from 'wgpu-matrix';
import { MaterialInterface, RenderPass2DInterface } from '../../types';
import ContainerNode2d from './ContainerNode2d';

class SceneNode2d extends ContainerNode2d {
  name = '';

  position?: 'absolute'

  x?: number;

  y?: number;

  width?: string | number;

  height?: string | number;

  color?: number[]

  margin?: { left?: number, right?: number, top?: number, bottom?: number }
  
  border?: { color: number[], width: number }

  material: MaterialInterface | null = null

  addInstance(
    renderPass: RenderPass2DInterface,
    left: number,
    top: number,
    width: number,
    height: number,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (this.material || this.color) {
      renderPass.addDrawable(
        this,
        canvasWidth,
        canvasHeight,
        { x: left, y: top, width, height },
      )
    }
  }
}

export default SceneNode2d;
