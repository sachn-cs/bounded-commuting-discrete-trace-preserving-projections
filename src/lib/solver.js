/**
 * Local patch stiffness assembly and constrained solves for boundary
 * weight computation.
 */

import { dot, cross, subtract, norm, zeros, luSolve, infinityNorm } from './utils.js'
import { SingularError } from './errors.js'

/**
 * Static utility for assembling surface-patch stiffness matrices and solving
 * constrained linear systems during boundary weight computation.
 *
 * Constraints are enforced exactly with a Lagrange-multiplier (bordered)
 * system, so every stiffness row is preserved and the recovered solution
 * satisfies the original equations up to the constraint multiplier.
 */
export class Solver {
  /**
   * Assembles the surface stiffness matrix for -Delta_Gamma.
   * @param {!Array<!Array<number>>} vertices
   * @param {!Array<!Array<number>>} triangles
   * @return {!Array<!Array<number>>}
   */
  static assembleSurfaceStiffness (vertices, triangles) {
    const n = vertices.length
    const K = zeros(n, n)

    triangles.forEach((tri) => {
      const v = tri.map((i) => vertices[i])
      const ke = Solver.triangleStiffness(v)

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          K[tri[i]][tri[j]] += ke[i][j]
        }
      }
    })

    return K
  }

  /**
   * Local stiffness matrix for -Delta_Gamma on a single triangle.
   * @param {!Array<!Array<number>>} v - Triangle vertices.
   * @return {!Array<!Array<number>>}
   * @private
   */
  static triangleStiffness (v) {
    const v1 = subtract(v[1], v[0])
    const v2 = subtract(v[2], v[0])

    const c = cross(v1, v2)
    const area = 0.5 * norm(c)

    if (area < 1e-12) {
      throw new SingularError(`Degenerate triangle in stiffness assembly: area=${area}`)
    }

    const G = [subtract(v[2], v[1]), subtract(v[0], v[2]), subtract(v[1], v[0])]

    const ke = zeros(3, 3)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ke[i][j] = dot(G[i], G[j]) / (4 * area)
      }
    }
    return ke
  }

  /**
   * Solves K x = b with a mean-zero constraint sum(x) = 0.
   *
   * The constraint is enforced exactly with a Lagrange multiplier lambda by
   * solving the symmetric bordered system
   *
   *   [ K  1 ] [ x ]   [ b ]
   *   [ 1^T 0 ] [lambda] = [ 0 ]
   *
   * and discarding the multiplier.  Unlike row replacement this keeps every
   * stiffness row intact and preserves symmetry, so x satisfies K x = b up to
   * a constant (lambda * 1) and is the true constrained solution.
   *
   * @param {!Array<!Array<number>>} K
   * @param {!Array<number>} b
   * @param {function=} onWarning - Callback invoked with a warning context
   *   object when the matrix is ill-conditioned.
   * @return {!Array<number>}
   */
  static solveWithConstraint (K, b, onWarning = console.warn) {
    const n = K.length
    if (n === 0) {
      return []
    }
    const A = K.map((row) => [...row, 1.0])
    const last = new Array(n + 1).fill(1.0)
    last[n] = 0.0
    A.push(last)
    const rhs = [...b, 0.0]

    const normEst = infinityNorm(A)
    if (normEst > 1e12) {
      onWarning({
        code: 'LOCAL_SOLVER_ILL_CONDITIONED',
        severity: 'warn',
        message:
          `Solver: matrix is ill-conditioned (norm=${normEst}). ` +
          'Results may be inaccurate.'
      })
    }

    try {
      return luSolve(A, rhs).slice(0, n)
    } catch (e) {
      throw new SingularError(
        `Solver: constrained solve failed (${e.message}). ` +
          'Patch matrix may be singular or ill-conditioned.'
      )
    }
  }
}
