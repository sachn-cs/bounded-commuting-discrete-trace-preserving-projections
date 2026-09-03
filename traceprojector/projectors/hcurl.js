/**
 * Lowest-order H(curl) (l=1) projector.
 *
 * Edge-based vector projection with boundary-aware tangential trace DoFs.
 */

import { dot, subtract } from '../utils.js'
import { lineQuadrature } from '../quadrature.js'

/**
 * Lowest-order H(curl) (l=1) edge-based projector implementing Pi^1.
 *
 * Projects vector functions onto the Nédélec first-kind (Whitney 1-form)
 * space.  Boundary edges use exact tangential-trace degrees of freedom
 * (∫_e u·t ds); interior edges use midpoint evaluation of the tangential
 * component.
 */
export class Hcurl {
  /**
   * @param {!Mesh} mesh
   * @param {!Whitney} whitney
   * @param {number} quadratureOrder
   */
  constructor (mesh, whitney, quadratureOrder) {
    this.mesh = mesh
    this.whitney = whitney
    this.quadratureOrder = quadratureOrder
  }

  /**
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {!Set<number>} boundaryEdgeSet
   * @return {!Array<number>}
   */
  project (u, point, tIdx, boundaryEdgeSet) {
    const tet = this.mesh.getTetrahedra()[tIdx]
    const bary = this.whitney.getBarycentric(tIdx, point)
    const edgeBasis = this.whitney.getEdgeBasis(tIdx, bary)

    const localEdges = [
      [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
    ]
    const result = [0, 0, 0]

    for (let e = 0; e < 6; e++) {
      const [i, j] = localEdges[e]
      const globalEdge = [tet[i], tet[j]]
      const eKey = this.edgeKey(globalEdge)
      const eIdx = this.mesh.getEdgeIndex(eKey)
      const sigma = this.mesh.getTetEdgeSign(tIdx, e)

      const coefficient = this.computeEdgeDof(u, eIdx) * sigma

      result[0] += coefficient * edgeBasis[e][0]
      result[1] += coefficient * edgeBasis[e][1]
      result[2] += coefficient * edgeBasis[e][2]
    }

    return result
  }

  /**
   * Computes the exact edge DoF for H(curl): ∫_e u·t ds.
   * For scalar u, this reduces to u(v1) - u(v0).
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {number} eIdx
   * @return {number}
   */
  computeEdgeDof (u, eIdx) {
    const e = this.mesh.getEdges()[eIdx]
    const v0 = this.mesh.getVertices()[e[0]]
    const v1 = this.mesh.getVertices()[e[1]]
    const edgeVec = subtract(v1, v0)

    if (typeof u(v0) === 'number') {
      return u(v1) - u(v0)
    }

    const { points, weights } = lineQuadrature(this.quadratureOrder)
    let integral = 0
    for (let q = 0; q < points.length; q++) {
      const s = points[q]
      const pt = [
        v0[0] + s * edgeVec[0],
        v0[1] + s * edgeVec[1],
        v0[2] + s * edgeVec[2]
      ]
      integral += weights[q] * dot(u(pt), edgeVec)
    }
    return integral
  }

  /**
   * Pi_ring^1: interior H(curl) projector with zero boundary trace.
   *
   * Uses the exact edge DoF ∫_e u·t ds on every interior edge, identical to
   * the trace DoFs on boundary edges; boundary edges get zero coefficient.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {!Set<number>} boundaryEdgeSet
   * @return {!Array<number>}
   */
  projectRing (u, point, tIdx, boundaryEdgeSet) {
    const tet = this.mesh.getTetrahedra()[tIdx]
    const bary = this.whitney.getBarycentric(tIdx, point)
    const edgeBasis = this.whitney.getEdgeBasis(tIdx, bary)
    const localEdges = [
      [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
    ]
    const result = [0, 0, 0]

    for (let e = 0; e < 6; e++) {
      const [i, j] = localEdges[e]
      const globalEdge = [tet[i], tet[j]]
      const eKey = this.edgeKey(globalEdge)
      const eIdx = this.mesh.getEdgeIndex(eKey)
      if (boundaryEdgeSet.has(eIdx)) {
        continue
      }
      const sigma = this.mesh.getTetEdgeSign(tIdx, e)
      const coefficient = this.computeEdgeDof(u, eIdx) * sigma
      result[0] += coefficient * edgeBasis[e][0]
      result[1] += coefficient * edgeBasis[e][1]
      result[2] += coefficient * edgeBasis[e][2]
    }
    return result
  }

  /**
   * E^1: discrete extension of edge boundary data.
   * @param {!Map<number, number>} boundaryData
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {!Set<number>} boundaryEdgeSet
   * @return {!Array<number>}
   */
  extendBoundary (boundaryData, point, tIdx, boundaryEdgeSet) {
    const tet = this.mesh.getTetrahedra()[tIdx]
    const bary = this.whitney.getBarycentric(tIdx, point)
    const edgeBasis = this.whitney.getEdgeBasis(tIdx, bary)
    const localEdges = [
      [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
    ]
    const result = [0, 0, 0]

    for (let e = 0; e < 6; e++) {
      const [i, j] = localEdges[e]
      const globalEdge = [tet[i], tet[j]]
      const eKey = this.edgeKey(globalEdge)
      const eIdx = this.mesh.getEdgeIndex(eKey)
      const sigma = this.mesh.getTetEdgeSign(tIdx, e)
      if (!boundaryEdgeSet.has(eIdx) || !boundaryData.has(eIdx)) {
        continue
      }
      const coefficient = boundaryData.get(eIdx) * sigma
      result[0] += coefficient * edgeBasis[e][0]
      result[1] += coefficient * edgeBasis[e][1]
      result[2] += coefficient * edgeBasis[e][2]
    }
    return result
  }

  /**
   * @param {!Array<number>} e
   * @return {number}
   */
  edgeKey (e) {
    const a = e[0]
    const b = e[1]
    const vc = this.mesh.getOriginalVertexCount()
    return a < b ? a * vc + b : b * vc + a
  }
}
