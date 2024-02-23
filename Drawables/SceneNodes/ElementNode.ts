import { MaterialInterface } from "../../types";
import SceneNode2d from "./SceneNode2d";

export type Style = {
  position?: 'absolute'

  left?: number;

  top?: number;

  right?: number;

  bottom?: number;

  flexDirection?: 'row' | 'column'

  justifyContent?: 'center'
  
  columnGap?: number;

  rowGap?: number;

  width?: string | number;

  height?: string | number;

  color?: number[]

  backgroundColor?: number[]

  margin?: { left?: number, right?: number, top?: number, bottom?: number }

  padding?: { left?: number, right?: number, top?: number, bottom?: number }

  border?: { color: number[], width: number }
}

class ElementNode extends SceneNode2d {
  name = '';

  style: Style

  material: MaterialInterface | null = null

  nodes: SceneNode2d[] = []

  onClick?: () => void

  screen = { top: 0, left: 0, bottom: 0, right: 0 }

  constructor(style: Style = {}) {
    super()

    this.style = style
  }
}

export const isElementNode = (r: unknown): r is ElementNode => (
  (r as ElementNode).style !== undefined
)

export default ElementNode
