import type {Mesh} from './mesh.js';
import type {Refinement} from './refinement.js';

/**
 * Boundary weight computation for Projector projections.
 *
 * Computes vertex patch weights, edge tangents/lengths, and face normals/areas
 * used by trace-preserving boundary DoFs.
 */
export class Weight {
  /**
   * @param mesh - The mesh.
   * @param meshRefinement - Refinement data structure.
   * @param onWarning - Optional warning callback.
   */
  constructor(
    mesh: Mesh,
    meshRefinement: Refinement,
    onWarning?: (ctx: {code: string; severity: 'warn' | 'error'; message: string}) => void,
  );

  /**
   * Computes all boundary weights.
   * @returns Object containing vertexBoundaryData, edgeBoundaryData,
   *   faceBoundaryData, and the Section 6.3 edge/face duality-functional maps.
   */
  compute(): {
    vertexBoundaryData: Map<
      number,
      {nodeMap: number[]; invNodeMap: Map<number, number>; psi: number[]}
    >;
    edgeBoundaryData: Map<
      number,
      {v0: number; v1: number; tangent: number[]; length: number}
    >;
    faceBoundaryData: Map<number, {normal: number[]; area: number}>;
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
