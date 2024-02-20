import { font } from '../../Font';
import { materialManager } from '../../Materials/MaterialManager';
import { MaterialInterface } from '../../types';
import Mesh2D from '../Mesh2D';
import SceneNode2d from './SceneNode2d';

class TextBox extends SceneNode2d {
  text: string

  mesh: Mesh2D | null = null

  constructor(text: string) {
    super()

    this.text = text
  }

  async createMesh(maxWidth?: number): Promise<Mesh2D> {
    this.mesh = font.text(this.text, maxWidth)

    this.material = await materialManager.get(18, 'Mesh2D', [])

    return this.mesh
  }
}

export const isTextBox = (r: unknown): r is TextBox => (
  (r as TextBox).text !== undefined
)

export default TextBox;
