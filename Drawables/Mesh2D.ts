import Drawable from './Drawable';

class Mesh2D extends Drawable {
  width: number;

  height: number;

  vertices: number[];

  texcoord: number[];

  indices: number[];

  constructor(vertices: number[], texcoord: number[], indices: number[], width: number, height: number) {
    super('Mesh2D')
  
    this.name = 'Mesh2D';
    
    this.vertices = vertices;
    this.texcoord = texcoord;
    this.indices =indices;

    this.width = width;
    this.height = height;
  }
}

export default Mesh2D;
