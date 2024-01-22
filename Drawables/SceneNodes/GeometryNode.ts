import SceneNode from "./SceneNode";
import SurfaceMesh from "../SurfaceMesh";

class GeometryNode extends SceneNode {
  mesh: SurfaceMesh;

  vertices: number[];
  
  normals: number[];

  texcoords: number[];
  
  indices: number[];

  constructor(mesh: SurfaceMesh, vertices: number[], normals: number[], texcoords: number[], indices: number[]) {
    super();
  
    this.mesh = mesh;
    this.vertices = vertices;
    this.normals = normals;
    this.texcoords = texcoords;
    this.indices = indices;
  }
}

export const isGeometryNode = (r: unknown): r is GeometryNode => (
  (r as GeometryNode).mesh !== undefined
  && (r as GeometryNode).vertices !== undefined
  && (r as GeometryNode).normals !== undefined
  && (r as GeometryNode).indices !== undefined
)

export default GeometryNode;
