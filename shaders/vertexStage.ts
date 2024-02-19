import { DrawableType } from "../types";

export const getVertexStage = (drawableType: DrawableType, lit: boolean): string => {
  if (drawableType === 'Mesh') {
    return /*wgsl*/`
      struct Vertex {
        @location(0) position: vec4f,
        @location(1) normal: vec4f,
        @location(2) texcoord: vec2f,
      }

      struct VertexOut {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
        @location(1) texcoord: vec2f,
        ${lit ? '@location(2) fragPos: vec4f,\n@location(3) normal: vec4f,' : ''}    
      }
          
      @vertex
      fn vs(
        @builtin(instance_index) instanceIndex: u32,
        vert: Vertex,
      ) -> VertexOut
      {
        var output: VertexOut;
      
        output.position = projectionMatrix * viewMatrix * modelMatrix[instanceIndex] * vert.position;
        output.color = instanceColor[instanceIndex];
        output.texcoord = vert.texcoord;
      
        ${lit
          ? `
          output.fragPos = viewMatrix * modelMatrix[0] * vert.position;
          output.normal = viewMatrix * modelMatrix[0] * vert.normal;          
          `
          : ''
        }
      
        return output;
      }
    `
  }

  if (drawableType === 'Billboard') {
    return /*wgsl*/`
      struct VertexOut {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
        @location(1) texcoord: vec2f,
      }
    
      @vertex
      fn vs(
        @builtin(instance_index) instanceIndex: u32,
        @builtin(vertex_index) vertexIndex : u32,
      ) -> VertexOut
      {
        let verts = array(
          vec4f(-1.0, 1.0, 0, 0),
          vec4f(-1.0, -1.0, 0, 0),
          vec4f(1.0, 1.0, 0, 0),
          vec4f(1.0, 1.0, 0, 0),
          vec4f(-1.0, -1.0, 0, 0),
          vec4f(1.0, -1.0, 0, 0),
        );

        let texcoords = array(
          vec2f(0.0, 1.0),
          vec2f(0.0, 0.0),
          vec2f(1.0, 1.0),
          vec2f(1.0, 1.0),
          vec2f(0.0, 0.0),
          vec2f(1.0, 0.0),
        );

        var output : VertexOut;

        // scale and/or rotate the vertex vector
        var vertexVector = modelMatrix[instanceIndex] * verts[vertexIndex];

        // Get world origin point by taking the fourth vector from the
        // model-to-world transformation matrix
        var origin = vec4f(modelMatrix[instanceIndex][3].xyz, 1);

        // Now transform the origin into camera space and then add 
        // the verex vector.
        var pos = viewMatrix * origin + vertexVector;

        output.position = projectionMatrix * pos;

        output.color = instanceColor[instanceIndex];
        output.texcoord = texcoords[vertexIndex];
        return output;
      }
    `
  }

  if (drawableType === 'Circle') {
    return /*wgsl*/`
      struct VertexOut {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
        @location(1) texcoord: vec2f,
      }

      @vertex
      fn vs(
        @builtin(instance_index) instanceIndex: u32,
        @builtin(vertex_index) vertexIndex : u32,
      ) -> VertexOut
      {
        var output : VertexOut;

        var segment = vertexIndex / 6;
        var segmentVertIndex = vertexIndex % 6;

        var pi = 3.14159;
        var radiansPerSegment = pi * 2 / vertProperties.numSegments;

        var radians = f32(segment) * radiansPerSegment;

        var x: f32;
        var y: f32;

        var radius = vertProperties.radius;
        var thickness = vertProperties.thickness;

        if (segmentVertIndex == 0) {
          x = (radius - thickness) * cos(radians);
          y = (radius - thickness) * sin(radians);
        }
        else if (segmentVertIndex == 1 || segmentVertIndex == 4) {
          x = (radius) * cos(radians);
          y = (radius) * sin(radians);
        }
        else if (segmentVertIndex == 2 || segmentVertIndex == 3) {
          x = (radius - thickness) * cos(radians + radiansPerSegment);
          y = (radius - thickness) * sin(radians + radiansPerSegment);
        }
        else if (segmentVertIndex == 5) {
          x = (radius) * cos(radians + radiansPerSegment);
          y = (radius) * sin(radians + radiansPerSegment);
        }

        output.position = projectionMatrix * viewMatrix * modelMatrix[0] * vec4f(x, y, 0, 1);

        output.color = instanceColor[instanceIndex];

        return output;
      }
    `
  }

  if (drawableType === '2D') {
    return /*wgsl*/`
      struct Dimensions {
        x: f32,
        y: f32,
        width: f32,
        height: f32,
      }
    
      @group(1) @binding(0) var<uniform> instanceColor: array<vec4f, 1000>;
      @group(1) @binding(1) var<uniform> dimensions: array<Dimensions, 1000>;

      struct VertexOut {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
        @location(1) texcoord: vec2f,
      }

      @vertex
      fn vs(
        @builtin(instance_index) instanceIndex: u32,
        @builtin(vertex_index) vertexIndex : u32,
      ) -> VertexOut
      {
        var output : VertexOut;
        
        var vertex = vec4(0.0, 0.0, 0, 1);

        if (vertexIndex == 0 || vertexIndex == 5) {
          vertex.x = dimensions[instanceIndex].x + dimensions[instanceIndex].width;
          vertex.y = dimensions[instanceIndex].y * aspectRatio;
          output.texcoord.x = 1.0;
          output.texcoord.y = 0.0;
        }
        else if (vertexIndex == 1) {
          vertex.x = dimensions[instanceIndex].x;
          vertex.y = dimensions[instanceIndex].y * aspectRatio;
          output.texcoord.x = 0.0;
          output.texcoord.y = 0.0;
        }
        else if (vertexIndex == 2 || vertexIndex == 3) {
          vertex.x = dimensions[instanceIndex].x;
          vertex.y = (dimensions[instanceIndex].y - dimensions[instanceIndex].height) * aspectRatio;
          output.texcoord.x = 0.0;
          output.texcoord.y = 1.0;
        }
        else if (vertexIndex == 4) {
          vertex.x = dimensions[instanceIndex].x + dimensions[instanceIndex].width;
          vertex.y = (dimensions[instanceIndex].y - dimensions[instanceIndex].height) * aspectRatio;
          output.texcoord.x = 1.0;
          output.texcoord.y = 1.0;
        }

        output.position = vertex;
        output.color = instanceColor[instanceIndex];

        return output;
      }
    `
  }

  if (drawableType === 'Mesh2D') {
    return /*wgsl*/`
      @group(1) @binding(0) var<uniform> transform: array<mat3x3f, 1000>;
      @group(1) @binding(1) var<uniform> instanceColor: array<vec4f, 1000>;

      struct Vertex {
        @location(0) position: vec2f,
        @location(1) texcoord: vec2f,
      }

      struct VertexOut {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f,
        @location(1) texcoord: vec2f,
      }

      @vertex
      fn vs(
        @builtin(instance_index) instanceIndex: u32,
        vertex: Vertex,
      ) -> VertexOut
      {
        var output : VertexOut;

        var point = transform[instanceIndex] * vec3f(vertex.position, 1);

        output.position = vec4f(point.xy, 0, 1);
        output.texcoord = vertex.texcoord;
        output.color = instanceColor[instanceIndex];

        return output;
      }
    `
  }

  throw new Error(`Unknown drawable type: ${drawableType} `)
}