import type {Mesh} from '../mesh.js';
import type {Whitney} from '../whitney.js';
import type {Refinement} from '../refinement.js';

export class H1 {
  constructor(mesh: Mesh, whitney: Whitney, meshRefinement: Refinement);
  project(
    u: (point: number[]) => number,
    point: number[],
    tIdx: number,
    vertexBoundaryData: Map<
      number,
      {nodeMap: number[]; psi: number[]}
    >,
  ): number;
  computeBoundaryIntegralH1(
    vIdx: number,
    u: (point: number[]) => number,
    vertexBoundaryData: Map<
      number,
      {nodeMap: number[]; psi: number[]}
    >,
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
