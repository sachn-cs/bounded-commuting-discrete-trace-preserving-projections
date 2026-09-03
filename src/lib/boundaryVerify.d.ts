import type {Projector} from './traceprojector.js';

export interface BoundaryDoFCheck {
  /** Form degree (0 = vertex, 1 = edge, 2 = face). */
  l: number;
  /** Boundary entity index. */
  idx: number;
  /** RT basis index (face level only). */
  edge?: number;
  /** Expected normalized DoF (1) or ∫_f RT·n. */
  expected: number;
  /** Value recovered by the weight functional. */
  got: number;
}

export interface BoundaryWeightVerifyResult {
  ok: boolean;
  passed: number;
  failing: number;
  checks: BoundaryDoFCheck[];
}

export function verifyBoundaryWeights(
  projector: Projector,
  tol?: number,
): BoundaryWeightVerifyResult;
