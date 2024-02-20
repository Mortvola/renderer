import Http from "../Http/src"
import Mesh2D from "./Drawables/Mesh2D";

type Character = {
  id: number,
  index: number,
  char: string,
  width: number,
  height: number,
  xoffset: number,
  yoffset: number,
  xadvance: number,
  chnl: number,
  x: number,
  y: number,
  page: number,
}

type FontConfig = {
  chars: Character[],
  info: { size: number },
  common: { scaleW: number, scaleH: number, lineHeight: number }
}

class Font {
  chars: Map<string, Character> = new Map()

  textuerWidth;

  textureHeight;

  fontSize: number;

  lineHeight: number;

  private constructor(config: FontConfig) {
    for (let character of config.chars) {
      this.chars.set(character.char, character)
    }

    this.textuerWidth = config.common.scaleW
    this.textureHeight = config.common.scaleH
    this.lineHeight = config.common.lineHeight
    this.fontSize = config.info.size;
  }

  static async create() {
    let config: FontConfig | undefined = undefined

    const response = await Http.get<FontConfig>('/fonts/OpenSans-Regular-msdf.json')

    if (response.ok) {
      config = await response.body()
    }

    if (!config) {
      throw new Error('character config not downloaded')
    }

    return new Font(config)
  }

  text(text: string, maxWidth?: number): Mesh2D {
    const vertices: number[] = [];
    const texcoords: number[] = [];
    const indexes: number[] = [];

    let width = 0;
    let height = 0;
    let line = 0;
    let cursor = 0;
    let wordBreak = false

    const scale = 16 / this.fontSize;

    for (const char of text) {
      const character = this.chars.get(char)

      if (character) {
        if (character.char === ' ') {
          wordBreak = true
          cursor += character.xadvance * scale
          continue
        }

        const numVertices = vertices.length / 2;

        let left = cursor + character.xoffset * scale
        let right = left + character.width * scale

        if (maxWidth && right >= maxWidth && wordBreak) {
          line += 1
          cursor = 0

          left = cursor + character.xoffset * scale
          right = left + character.width * scale  

          wordBreak = false
        }

        const top = line * this.lineHeight * scale + character.yoffset * scale
        const bottom = top + character.height * scale

        vertices.push(left, top)
        vertices.push(left, bottom)
        vertices.push(right, bottom)
        vertices.push(right, top)

        texcoords.push(character.x / this.textuerWidth, character.y / this.textureHeight)
        texcoords.push(character.x / this.textuerWidth, (character.y + character.height) / this.textureHeight)
        texcoords.push((character.x + character.width) / this.textuerWidth, (character.y + character.height) / this.textureHeight)
        texcoords.push((character.x + character.width) / this.textuerWidth, character.y / this.textureHeight)
        
        indexes.push(
          numVertices + 0,
          numVertices + 1,
          numVertices + 3,
          numVertices + 3,
          numVertices + 1,
          numVertices + 2,
        )

        cursor += character.xadvance * scale

        width = Math.max(width, cursor)
        height = Math.max(height, line * this.lineHeight * scale)
      }
    }

    return new Mesh2D(vertices, texcoords, indexes, width, height)
  }
}

export const font = await Font.create()

export default Font

