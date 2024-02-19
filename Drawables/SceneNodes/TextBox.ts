import { RenderPass2DInterface } from '../../types';
import Mesh2D from '../Mesh2D';
import SceneNode2d from './SceneNode2d';

class TextBox extends SceneNode2d {
  mesh: Mesh2D

  constructor(mesh: Mesh2D) {
    super()

    this.mesh = mesh
  }

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

export const isTextBox = (r: unknown): r is TextBox => (
  (r as TextBox).mesh !== undefined
)

export default TextBox;
