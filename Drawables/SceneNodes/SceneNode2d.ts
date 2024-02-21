import { MaterialInterface } from '../../types';
import ContainerNode2d from './ContainerNode2d';

export type Style = {
  position?: 'absolute'

  x?: number;

  y?: number;

  width?: string | number;

  height?: string | number;

  color?: number[]
  
  backgroundColor?: number[]

  margin?: { left?: number, right?: number, top?: number, bottom?: number }
  
  border?: { color: number[], width: number }
}

class SceneNode2d extends ContainerNode2d {
  name = '';

  style: Style

  material: MaterialInterface | null = null

  constructor(style: Style = {}) {
    super()

    this.style = style
  }
}

export default SceneNode2d;
