import type {Mesh} from '../mesh.js';
import type {Whitney} from '../whitney.js';

export class Hdiv {
  constructor(mesh: Mesh, whitney: Whitney, quadratureOrder: number);
  project(
    u: (point: number[]) => number | number[],
    point: number[],
    tIdx: number,
    boundaryFaceSet: Set<number>,
  ): number[];
  computeFaceDof(
    u: (point: number[]) => number | number[],
    fIdx: number,
  ): number;
  projectRing(
    u: (point: number[]) => number | number[],
    point: number[],
    tIdx: number,
    boundaryFaceSet: Set<number>,
  ): number[];
  extendBoundary(
    boundaryData: Map<number, number>,
    point: number[],
    tIdx: number,
    boundaryFaceSet: Set<number>,
  ): number[];
}
