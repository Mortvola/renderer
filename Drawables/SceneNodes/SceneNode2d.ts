import { MaterialInterface } from '../../types';
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
}

export default SceneNode2d;
