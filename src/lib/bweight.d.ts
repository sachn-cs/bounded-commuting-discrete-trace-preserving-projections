export interface VertexWeight {
  pair: (u: (point: number[]) => number) => number;
  integral: number;
  psi: number[];
  faces: number[][];
}

export interface EdgeWeight {
  pair: (u: (point: number[]) => number[]) => number;
  edges: number[][];
  eta: number[];
}

export function vertexWeight(
  verts: number[][],
  faces: number[][],
  vIdx: number,
): VertexWeight;

export function edgeWeight(
  verts: number[][],
  faces: number[][],
  ePair: number[],
): EdgeWeight;
