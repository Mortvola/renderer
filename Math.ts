import { Quat, Vec2, Vec3, Vec4, mat4, vec2, vec3, vec4 } from "wgpu-matrix";

export const degToRad = (d: number) => d * Math.PI / 180;
export const radToDeg = (r: number) => (r /  Math.PI) * 180;

export const normalizeDegrees = (d: number) => {
  let normalized = d % 360;
  if (normalized < 0) {
    normalized += 360;
  }

  return normalized;
}

// Implementation of the Möller-Trumbore algorithm
export const intersectTriangle = (
  origin: Vec3, dir: Vec3, v0: Vec3, v1: Vec3, v2: Vec3,
): [number, number, number] | null => {
  const epsilon = 0.000001;

  const edge1 = vec3.subtract(v1, v0);
  const edge2 = vec3.subtract(v2, v0);

  const pvec = vec3.cross(dir, edge2);

  const det = vec3.dot(edge1, pvec);

  if (det < epsilon) {
    return null;
  }

  const inverseDet = 1 / det;

  const tvec = vec3.subtract(origin, v0);

  const u = vec3.dot(tvec, pvec) * inverseDet;
  if (u < 0.0 || u > 1.0) {
    return null;
  }

  const qvec = vec3.cross(tvec, edge1);

  const v = vec3.dot(dir, qvec) * inverseDet;
  if (v < 0.0 || u + v > 1.0) {
    return null;
  }

  const t = vec3.dot(edge2, qvec) * inverseDet;

  return [t, u, v];
}

export const intersectionPlane = (planePoint: Vec4, planeNormal: Vec4, origin: Vec4, ray: Vec4): Vec4 | null => {
  const denom = vec4.dot(ray, planeNormal);

  if (denom < -1e-6 || denom > 1e-6) {
    const v = vec4.subtract(planePoint, origin);
    const t = vec4.dot(v, planeNormal) / denom;

    if (t >= 0) {
      return vec4.add(origin, vec4.mulScalar(ray, t))
    }
  }

  return null;
}

const clamp = (v: number, l: number, h: number): number => {
  if (v < l) {
    return l;
  }

  if (v > h) {
    return h;
  }

  return v;
}

export const getEulerAngles = (q: Quat) => {
  const m = mat4.fromQuat(q)

  let x;
  let z;
  const y = Math.asin( clamp( m[8], -1, 1 ) );

  if ( Math.abs( m[8] ) < 0.9999999 ) {
    x = Math.atan2(-m[9], m[10] );
    z = Math.atan2(-m[4], m[0] );
  } else {
    x = Math.atan2( m[6], m[5] );
    z = 0;
  }

  return [x, y, z];
}

// Gravitational constant in meters / sec^2
export const gravity = -9.81;

// Minimum velocity needed to hit target
// This assumes the starting position is at (0, 0)
// Given that the gravitational constant is in meters, all parameters are in meters.
export const minimumVelocity = (targetX: number, targetY: number) => (
  Math.sqrt(
    Math.sqrt(
      Math.pow(gravity, 2) * (Math.pow(targetX, 2) + Math.pow(targetY, 2)) - gravity * targetY
    )
  )
)

// Find the needed angles of launch (high and low)
// Given that the gravitational constant is in meters, all parameters are in meters.
export const anglesOfLaunch = (velocity: number, targetX: number, targetY: number) => {
  const sqrtTerm = Math.sqrt(
    Math.pow(velocity, 4) - gravity * (gravity * Math.pow(targetX, 2) - 2 * Math.pow(velocity, 2) * targetY)
  )

  // Note: we negate the Y component (second paramter) just to get atan2 to return a value in the correct quadrant.
  const lowAngle = Math.atan2((Math.pow(velocity, 2) - sqrtTerm),  -(gravity * targetX))
  const highAngle = Math.atan2((Math.pow(velocity, 2) + sqrtTerm), -(gravity * targetX))

  return [lowAngle, highAngle];
}

// Find the time to target given the target X, velocity and angle (in radians).
export const timeToTarget = (targetX: number, velocity: number, angle: number) => (
  targetX / (velocity * Math.cos(angle))
)


export const feetToMeters = (feet: number) => (
  feet * 0.3048
)

export const pointWithinCircle = (center: Vec2, radius: number, p: Vec2): boolean => {
  const distSquared = vec2.distSq(center, p);

  return distSquared <= radius * radius;
}

export const lineCircleIntersection = (center: Vec2, radius: number, p1: Vec2, p2: Vec2) => {
  const p1x = p1[0] - center[0];
  const p1y = p1[1] - center[1];
  const p2x = p2[0] - center[0];
  const p2y = p2[1] - center[1];

  let dx = p2x - p1x;
  let dy = p2y - p1y;

  if (dx === 0) {
    // Line is vertical

    let A = 1;
    let C = (p1x * p1x - radius * radius);

    const discriminate = -4 * A * C;

    if (discriminate < 0) {
      return null;
    }

    if (discriminate === 0) {
      const y = 0;

      return [vec2.create(p1x + center[0], y + center[1])]
    }

    const y1 = (Math.sqrt(discriminate)) / (2 * A);
    const y2 = (-Math.sqrt(discriminate)) / (2 * A);

    return [vec2.create(p1x + center[0], y1 + center[1]), vec2.create(p1x + center[0], y2 + center[1])];
  }
  
  let m = dy / dx;
  let b = p1y - m * p1x;

  let A = (m * m + 1);
  let B = 2 * (m * b);
  let C = (b * b - radius * radius);

  const discriminate = B * B - 4 * A * C;

  if (discriminate < 0) {
    // Line does not intersect circle
    return null;
  }

  if (discriminate === 0) {
    // Line is a tangent of the circle (touches at one point)
    const x = -B / (2 * A);
    const y = m * x + b;

    return [vec2.create(x + center[0], y + center[1])];
  }

  // Line intersects circle (two points)

  const x1 = (-B - Math.sqrt(discriminate)) / (2 * A);
  const x2 = (-B + Math.sqrt(discriminate)) / (2 * A);

  const y1 = m * x1 + b;
  const y2 = m * x2 + b;

  return [vec2.create(x1 + center[0], y1 + center[1]), vec2.create(x2 + center[0], y2 + center[1])];
}

// A line segment may be split from
// 1 (no intersection or a tangent) to
// 3 (two intersections with the circle) segments.
export const lineSegmentCircleIntersection = (center: Vec2, radius: number, p1: Vec2, p2: Vec2): [Vec2[], boolean[]] => {
  const result = lineCircleIntersection(center, radius, p1, p2);

  if (result === null || result.length === 1) {
    return [[p1, p2], [false, false]];
  }

  const v = vec2.subtract(p2, p1);

  const points: Vec2[] = [p1];
  const inside: boolean[] = [true, true];

  const computeT = (point: Vec2) => {
    if (v[0] === 0) {
      return (point[1] - p1[1]) / v[1];
    }

    return (point[0] - p1[0]) / v[0];
  }

  const t1 = computeT(result[0]);
  const t2 = computeT(result[1]);

  if (t1 < t2) {
    if (t1 > 0 && t1 < 1) {
      points.push(result[0]);
      inside[0] = false;
    }

    if (t2 > 0 && t2 < 1) {
      points.push(result[1]);
      inside[1] = false;
    }

    if (t2 < 0 || t1 > 1) {
      inside[0] = false;
      inside[1] = false;
    }
  }
  else {
    if (t2 > 0 && t2 < 1) {
      points.push(result[1]);
      inside[0] = false;
    }

    if (t1 > 0 && t1 < 1) {
      points.push(result[0]);
      inside[1] = false;
    }

    if (t1 < 0 || t2 > 1) {
      inside[0] = false;
      inside[1] = false;
    }
  }

  points.push(p2);

  return [points, inside];
}

// const p1 = vec2.create(0, -1.1);
// const p2 = vec2.create(1.1, 0);
// const center = vec2.create(0, 0);
// const radius = 1;

// const points = lineSegmentCircleIntersection(center, radius, p1, p2);

// for (const point of points) {
//   console.log(`${point}`)
// }

// const center = vec2.create(0.16735833883285522, -6.719706058502197);
// const radius = 1.524;

// const p1 = vec2.create(0.1875, -6.75);
// const p2 = vec2.create(0.1875, -6.375);

// const result2 = lineCircleIntersection(center, radius, p1, p2);

// if (result2) {
//   console.log(vec2.distance(center, result2[0]))
//   console.log(vec2.distance(center, result2[1]))
// }

// console.log(result2);


// const center = vec2.create(2, 2);
// const radius = 1;
// const p1 = vec2.create(0, 0);
// const p2 = vec2.create(8, 8);

// lineCircleIntersectionTest(center, radius, p1, p2);


export const midpointCircle = (center: Vec2, radius: number) => {
  let x = radius;
  let y = 0;

  console.log(`(${x + center[0]}, ${y + center[1]})`)
  console.log(`(${-x + center[0]}, ${y + center[1]})`)
  console.log(`(${y + center[0]}, ${x + center[1]})`)
  console.log(`(${y + center[0]}, ${-x + center[1]})`)

  let p = 1 - radius;

  while (x > y) {
    y += 1;

    if (p <= 0) {
      p = p + 2 * y + 1;
    }
    else {
      x -= 1;
      p = p + 2 & y - 2 * x + 1;
    }

    if (x < y) {
      break;
    }

    console.log(`(${-x + center[0]}, ${y + center[1]}) -> (${x + center[0]}, ${y + center[1]})`)
    console.log(`(${-x + center[0]}, ${-y + center[1]}) -> (${x + center[0]}, ${-y + center[1]})`)

    if (x !== y) {
      console.log(`(${-y + center[0]}, ${x + center[1]}) -> (${y + center[0]}, ${x + center[1]})`)
      console.log(`(${-y + center[0]}, ${-x + center[1]}) -> (${y + center[0]}, ${-x + center[1]})`)
    }
  }
}

export const circleRectangleIntersectionTest = (center: Vec2, radius: number, upperLeft: Vec2, lowerRight: Vec2): boolean => {
  const rectWidth = lowerRight[0] - upperLeft[0];
  const rectHeight = upperLeft[1] - lowerRight[1];

  const rectCenter = vec2.create(
     (lowerRight[0] + upperLeft[0]) / 2,
     (upperLeft[1] + lowerRight[1]) / 2,
  );

  const distance = vec2.create(
    Math.abs(center[0] - rectCenter[0]),
    Math.abs(center[1] - rectCenter[1]),
  )

  if (distance[0] > rectWidth / 2 + radius) {
    return false;
  }

  if (distance[1] > rectHeight / 2 + radius) {
    return false;
  }

  if (distance[0] <= rectWidth / 2) {
    return true;
  }

  if (distance[1] <= rectHeight / 2) {
    return true;
  }

  const cornerDistanceSq = (distance[0] - rectWidth / 2) * (distance[0] - rectWidth / 2)
    + (distance[1] - rectHeight / 2) * (distance[1] - rectHeight / 2);

  return cornerDistanceSq <= radius * radius;
}

// const center = vec2.create(-5.707, -2.708);
// const radius = 1;

// const upperLeft = vec2.create(-5, 5);
// const lowerRight = vec2.create(7, -2);

// const result = circleRectangleIntersectionTest(center, radius, upperLeft, lowerRight);

// console.log(`intersection: ${result}`);


const midPointLine = (p1: Vec2, p2: Vec2) => { 
  let start = p1;
  let end = p2;

  if (start[0] > end[0]) {
    start = p2;
    end = p1;
  }

  let sign = 1;
  if (start[1] > end[1]) {
    sign = -1;
  }

  // calculate dx & dy 
  let dx = end[0] - start[0]; 
  let dy = sign * (end[1] - start[1]); 

  // initial value of decision 
  // parameter d 
  let d = dy - (dx / 2); 
  let x = start[0], y = start[1]; 

  // Plot initial given point 
  // putpixel(x,y) can be used to 
  // print pixel of line in graphics 
  console.log(`${x}, ${y}`); 

  // iterate through value of X 
  while (x < end[0]) { 
    x += 1; 

    // E or East is chosen 
    if (d < 0) {
      d = d + dy; 
    } else { 
      // NE or North East is chosen 
      d += (dy - dx); 
      y += sign; 
    } 

    console.log(`${x}, ${y}`); 
  } 
}

// const p1 = vec2.create(0, 0);
// const p2 = vec2.create(5, 7);

// midPointLine(p1, p2);


// Cohen-Sutherland line clipping algorithm
export const lineRectangleClip = (p1: Vec2, p2: Vec2, upperLeft: Vec2, lowerRight: Vec2): Vec2[] | null => {
  const INSIDE = 0; // 0000
  const LEFT = 1;   // 0001
  const RIGHT = 2;  // 0010
  const BOTTOM = 4; // 0100
  const TOP = 8;    // 1000
  
  let x0 = p1[0];
  let y0 = p1[1];

  let x1 = p2[0];
  let y1 = p2[1];

  const outcode = (x: number, y: number) => {
    let code = INSIDE;

    if (x < upperLeft[0]) {
      code |= LEFT;
    } else if (x > lowerRight[0]) {
      code |= RIGHT;
    }

    if (y < lowerRight[1]) {
      code |= BOTTOM;
    }
    else if (y > upperLeft[1]) {
      code |= TOP;
    }

    return code;
  }

  let outcode0 = outcode(x0, y0);
  let outcode1 = outcode(x1, y1);

  for (;;) {
    if (!(outcode0 | outcode1)) {
      break;
    }

    if (outcode0 & outcode1) {
      return null;
    }

    // console.log('fail');

    // break;
    let x = 0;
    let y = 0;

    let outcodeOut = outcode1 > outcode0 ? outcode1 : outcode0;

    if (outcodeOut & TOP) {
      x = x0 + (x1 - x0) * (upperLeft[1] - y0) / (y1 - y0);
      y = upperLeft[1];
    }
    else if (outcodeOut & BOTTOM) {
      x = x0 + (x1 - x0) * (lowerRight[1] - y0) / (y1 - y0);
      y = lowerRight[1];
    }
    else if (outcodeOut & RIGHT) {
      y = y0 + (y1 - y0) * (lowerRight[0] - x0) / (x1 - x0);
      x = lowerRight[0];
    }
    else if (outcodeOut & LEFT) {
      y = y0 + (y1 - y0) * (upperLeft[0] - x0) / (x1 - x0);
      x = upperLeft[0];
    }

    if (outcodeOut === outcode0) {
      x0 = x;
      y0 = y;
      outcode0 = outcode(x0, y0);
    }
    else {
      x1 = x;
      y1 = y;
      outcode1 = outcode(x1, y1);
    }
  }

  return [vec2.create(x0, y0), vec2.create(x1, y1)];
}
