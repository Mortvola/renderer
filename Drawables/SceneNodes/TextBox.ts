import { font } from '../../../Font';
import { materialManager } from '../../Materials/MaterialManager';
import { MaterialInterface } from '../../types';
import Mesh2D from '../Mesh2D';
import SceneNode2d from './SceneNode2d';

class TextBox extends SceneNode2d {
  text: string

  mesh: Mesh2D

  private constructor(text: string, mesh: Mesh2D, material: MaterialInterface) {
    super()

    this.text = text
    this.mesh = mesh
    this.material = material
  }

  static async create(text: string): Promise<TextBox> {
    const mesh = font.text(text)

    const material = await materialManager.get(18, 'Mesh2D', [])

    return new TextBox(text, mesh, material);
  }
}

export const isTextBox = (r: unknown): r is TextBox => (
  (r as TextBox).text !== undefined
)

export default TextBox;
