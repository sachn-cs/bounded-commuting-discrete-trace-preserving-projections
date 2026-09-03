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

export interface FaceWeight {
  pair: (u: (point: number[]) => number[]) => number;
  nBasis: number;
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

export function faceWeight(
  verts: number[][],
  faces: number[][],
  fFace: number[],
): FaceWeight;
