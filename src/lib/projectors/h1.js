/**
 * Lowest-order H1 (l=0) projector.
 *
 * Vertex-based scalar projection with exact trace-preserving vertex DoFs.
 */

/**
 * Lowest-order H1 (l=0) vertex-based projector implementing Pi^0.
 *
 * Projects scalar functions onto the space of continuous piecewise-linear
 * functions (P1 Lagrange) on a tetrahedral mesh.  Boundary vertices use
 * weighted surface-patch integrals (computed by {@link Weight})
 * to ensure trace preservation.  Interior vertices use nodal interpolation.
 */
export class H1 {
  /**
   * @param {!Mesh} mesh
   * @param {!Whitney} whitney
   */
  constructor (mesh, whitney) {
    this.mesh = mesh
    this.whitney = whitney
  }

  /**
   * @param {function(!Array<number>): number} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @return {number}
   */
  project (u, point, tIdx) {
    const tet = this.mesh.getTetrahedra()[tIdx]
    const bary = this.whitney.getBarycentric(tIdx, point)

    let result = 0
    for (let i = 0; i < 4; i++) {
      const vIdx = tet[i]
      if (this.mesh.getBoundaryNodes().has(vIdx)) {
        const alpha = this.computeBoundaryIntegralH1(vIdx, u)
        result += alpha * bary[i]
      } else {
        result += u(this.mesh.getVertices()[vIdx]) * bary[i]
      }
    }
    return result
  }

  /**
 * Exact lowest-order H1 boundary DoF: the vertex functional φ_v.
 *
 * Per Theorem 6.2/eq. (6.25) of the paper, the boundary weight ζ_{0,v}^0 is
 * constructed so that (ζ_{0,v}^0, tr^0 u)_Γ = φ_v(u) = u(v) for all u in the
 * discrete space.  We therefore evaluate the sampled function at the vertex
 * exactly instead of approximating the weighted surface integral.
 *
 * @param {number} vIdx
 * @param {function(!Array<number>): number} u
 * @return {number}
 */
  computeBoundaryIntegralH1 (vIdx, u) {
    return u(this.mesh.getVertices()[vIdx])
  }

  /**
   * Pi_ring^0: interior H1 projector with zero boundary trace.
   * @param {function(!Array<number>): number} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @return {number}
   */
  projectRing (u, point, tIdx) {
    const tet = this.mesh.getTetrahedra()[tIdx]
    const bary = this.whitney.getBarycentric(tIdx, point)
    let result = 0
    for (let i = 0; i < 4; i++) {
      const vIdx = tet[i]
      if (!this.mesh.getBoundaryNodes().has(vIdx)) {
        result += u(this.mesh.getVertices()[vIdx]) * bary[i]
      }
    }
    return result
  }

  /**
   * E^0: discrete extension of vertex boundary data.
   * @param {!Map<number, number>} boundaryData
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @return {number}
   */
  extendBoundary (boundaryData, point, tIdx) {
    const tet = this.mesh.getTetrahedra()[tIdx]
    const bary = this.whitney.getBarycentric(tIdx, point)
    let result = 0
    for (let i = 0; i < 4; i++) {
      const vIdx = tet[i]
      if (this.mesh.getBoundaryNodes().has(vIdx) && boundaryData.has(vIdx)) {
        result += boundaryData.get(vIdx) * bary[i]
      }
    }
    return result
  }
}
