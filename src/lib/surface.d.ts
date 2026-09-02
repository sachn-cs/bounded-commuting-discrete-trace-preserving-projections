export function triangleFrame(
  verts: number[][],
): {
  normal: number[];
  tangent1: number[];
  tangent2: number[];
  areaNormal: number[];
  area: number;
};

export function gradGamma(
  pt: number[],
  verts: number[][],
  u: (point: number[]) => number,
  h?: number,
): number[];

export function rotGamma(
  pt: number[],
  verts: number[][],
  u: (point: number[]) => number,
): number[];

export function curlGamma(
  pt: number[],
  verts: number[][],
  v: (point: number[]) => number[],
  h?: number,
): number;

export function divGamma(
  pt: number[],
  verts: number[][],
  v: (point: number[]) => number[],
  h?: number,
): number;

export function muTent(
  faceVerts: number[][],
  barycenter: number[],
  pt: number[],
): number;
