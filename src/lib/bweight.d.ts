export interface VertexWeight {
  pair: (u: (point: number[]) => number) => number;
  integral: number;
  psi: number[];
  faces: number[][];
}

export function vertexWeight(
  verts: number[][],
  faces: number[][],
  vIdx: number,
): VertexWeight;
