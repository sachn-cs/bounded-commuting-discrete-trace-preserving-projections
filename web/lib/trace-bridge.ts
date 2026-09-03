import {
  Mesh,
  Whitney,
  Projector,
} from "traceprojector";
import { generateUnitCubeMesh } from "traceprojector/generator";

export type ScalarFn = (p: number[]) => number;
export type VectorFn = (p: number[]) => [number, number, number];

export type FormDegree = 0 | 1 | 2 | 3;

export interface ProjectorBundle {
  mesh: Mesh;
  whitney: Whitney;
  projector: Projector;
  tets: number;
  vertices: number;
}

export function buildProjector(
  subdivision: number,
  quadratureOrder: number
): ProjectorBundle {
  const mesh = generateUnitCubeMesh(subdivision);
  const whitney = new Whitney(mesh);
  const projector = new Projector(mesh, whitney, { quadratureOrder });
  projector.computeBoundaryWeights();
  projector.buildLocator();
  return {
    mesh,
    whitney,
    projector,
    tets: (mesh as unknown as { tetrahedra?: unknown[] }).tetrahedra?.length ?? 0,
    vertices: (mesh as unknown as { vertices?: unknown[] }).vertices?.length ?? 0,
  };
}

export function projectAtPoint(
  projector: Projector,
  fn: ScalarFn,
  point: [number, number, number],
  p: number
): { value: number; tIdx: number; bary: [number, number, number, number] } {
  const result = projector.projectAtPoint(fn, point, 0, p) as {
    value: number;
    tIdx: number;
    bary: [number, number, number, number];
  };
  return result;
}
