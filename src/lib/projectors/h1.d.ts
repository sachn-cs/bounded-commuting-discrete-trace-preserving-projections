import type {Mesh} from '../mesh.js';
import type {Whitney} from '../whitney.js';

export class H1 {
  constructor(mesh: Mesh, whitney: Whitney);
  project(u: (point: number[]) => number, point: number[], tIdx: number): number;
  computeBoundaryIntegralH1(
    vIdx: number,
    u: (point: number[]) => number,
  ): number;
  projectRing(
    u: (point: number[]) => number,
    point: number[],
    tIdx: number,
  ): number;
  extendBoundary(
    boundaryData: Map<number, number>,
    point: number[],
    tIdx: number,
  ): number;
}