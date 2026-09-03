import type {Mesh} from './mesh.js';

/**
 * Boundary weight computation for Projector projections.
 *
 * Computes the Section 6.3 vertex/edge/face duality functionals plus edge
 * tangents/lengths and face normals/areas used by trace-preserving DoFs.
 */
export class Weight {
  /**
   * @param mesh - The mesh.
   * @param onWarning - Optional warning callback.
   */
  constructor(
    mesh: Mesh,
    onWarning?: (ctx: {code: string; severity: 'warn' | 'error'; message: string}) => void,
  );

  /**
   * Computes all boundary weights.
   * @returns Object containing edgeBoundaryData, faceBoundaryData, and the
   *   Section 6.3 vertex/edge/face duality-functional maps.
   */
  compute(): {
    edgeBoundaryData: Map<
      number,
      {v0: number; v1: number; tangent: number[]; length: number}
    >;
    faceBoundaryData: Map<number, {normal: number[]; area: number}>;
    vertexBoundaryWeights: Map<
      number,
      {
        pair: (u: (point: number[]) => number[]) => number;
        integral: number;
        psi: number[];
        faces: number[][];
      }
    >;
    edgeBoundaryWeights: Map<
      number,
      {
        ePair: number[];
        pair: (u: (point: number[]) => number[]) => number;
        edges: number[][];
        eta: number[];
      }
    >;
    faceBoundaryWeights: Map<
      number,
      {
        face: number[];
        pair: (u: (point: number[]) => number[]) => number;
        nBasis: number;
      }
    >;
  };
}
