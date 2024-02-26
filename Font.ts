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
    let wordBreak: number | null = null

    const scale = 16 / this.fontSize;

    let characters: Character[] = []

    const outputCharacters = (
      characters: Character[],
      numChars: number,
      width: number,
      height: number,
      line: number
    ): [number, number] => {
      let cursor = 0;

      for (let i = 0; i < numChars; i += 1) {
        const character = characters[i]

        let left = cursor + character.xoffset * scale
        let right = left + character.width * scale

        const top = line * this.lineHeight * scale + character.yoffset * scale
        const bottom = top + character.height * scale

        const numVertices = vertices.length / 2;

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
        height = Math.max(height, (line + 1) * this.lineHeight * scale)
      }

      return [width, height]
    }

    for (let i = 0; i < text.length; i += 1) {
      const character = this.chars.get(text[i])

      if (character) {
        if (character.char === ' ') {
          wordBreak = characters.length
          cursor += character.xadvance * scale

          characters.push(character);

          continue
        }

        let left = cursor + character.xoffset * scale
        let right = left + character.width * scale

        if (maxWidth && right >= maxWidth && wordBreak !== null) {
          [width, height] = outputCharacters(characters, wordBreak, width, height, line)

          i -= (characters.length - wordBreak)

          characters = []

          line += 1
          cursor = 0

          wordBreak = null

          continue;
        }

        cursor += character.xadvance * scale

        characters.push(character)
      }
    }

    if (characters.length > 0) {
      [width, height] = outputCharacters(characters, characters.length, width, height, line)
    }

    return new Mesh2D(vertices, texcoords, indexes, width, height)
  }
}

export const font = await Font.create()

export default Font

