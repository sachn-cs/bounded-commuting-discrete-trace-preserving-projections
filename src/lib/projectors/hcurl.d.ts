import type {Mesh} from '../mesh.js';
import type {Whitney} from '../whitney.js';

export class Hcurl {
  constructor(mesh: Mesh, whitney: Whitney, quadratureOrder: number);
  project(
    u: (point: number[]) => number | number[],
    point: number[],
    tIdx: number,
    boundaryEdgeSet: Set<number>,
  ): number[];
  computeEdgeDof(
    u: (point: number[]) => number | number[],
    eIdx: number,
  ): number;
  projectRing(
    u: (point: number[]) => number | number[],
    point: number[],
    tIdx: number,
    boundaryEdgeSet: Set<number>,
  ): number[];
  extendBoundary(
    boundaryData: Map<number, number>,
    point: number[],
    tIdx: number,
    boundaryEdgeSet: Set<number>,
  ): number[];
}
