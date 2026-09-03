/**
 * Lowest-order H(div) (l=2) projector.
 *
 * Face-based vector projection with boundary-aware normal trace DoFs.
 */

import { dot, numericalGradient, triangleArea } from '../utils.js'
import { triangleQuadrature, barycentricToCartesian } from '../quadrature.js'

/**
 * Lowest-order H(div) (l=2) face-based projector implementing Pi^2.
 *
 * Projects vector functions onto the Raviart-Thomas (Whitney 2-form) space.
 * Every face uses the same exact normal-flux degree of freedom
 * (∫_f u·n dA) with the mesh-orientation normal, so interior faces share a
 * consistent coefficient with both adjacent tetrahedra and the discrete
 * normal trace is continuous across the mesh.
 */
export class Hdiv {
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
   * @param {!Set<number>} boundaryFaceSet
   * @return {!Array<number>}
   */
  project (u, point, tIdx, boundaryFaceSet) {
    const bary = this.whitney.getBarycentric(tIdx, point)
    const faceBasis = this.whitney.getFaceBasis(tIdx, bary)

    const tFaces = this.mesh.getTetrahedronFaces(tIdx)
    const result = [0, 0, 0]

    for (let f = 0; f < 4; f++) {
      const fIdx = tFaces[f]
      const coefficient = this.computeFaceDof(u, fIdx)
      const sign = this.faceBasisSign(tIdx, f, fIdx)
      result[0] += sign * coefficient * faceBasis[f][0]
      result[1] += sign * coefficient * faceBasis[f][1]
      result[2] += sign * coefficient * faceBasis[f][2]
    }

    return result
  }

  /**
   * Computes the exact face DoF for H(div): ∫_f u·n dA.
   * For scalar u, this integrates grad(u)·n over the face.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {number} fIdx
   * @return {number}
   */
  computeFaceDof (u, fIdx) {
    const f = this.mesh.getFaces()[fIdx]
    const verts = f.map((i) => this.mesh.getVertices()[i])
    const normal = this.mesh.getFaceOutwardNormal(fIdx)
    const area = triangleArea(verts[0], verts[1], verts[2])
    const { bary, weights } = triangleQuadrature(this.quadratureOrder)

    const isScalar = typeof u(verts[0]) === 'number'
    let integral = 0
    for (let q = 0; q < bary.length; q++) {
      const pt = barycentricToCartesian(verts, bary[q])
      if (isScalar) {
        const grad = numericalGradient(u, pt)
        integral += weights[q] * dot(grad, normal)
      } else {
        integral += weights[q] * dot(u(pt), normal)
      }
    }
    return integral * area
  }

  /**
   * Sign aligning the Whitney face-basis orientation for local face f of tet
   * tIdx with the mesh-stored face orientation used by the DoFs.
   *
   * The Whitney face basis points outward from the tetrahedron and its local
   * vertex ordering differs from the mesh's stored ordering by a permutation,
   * so the flux coefficient must be multiplied by the sign of (phi_f . n_stored)
   * evaluated on the face to reproduce the same normal trace on both adjacent
   * tetrahedra.
   * @param {number} tIdx
   * @param {number} f
   * @param {number} fIdx
   * @return {number} +1 or -1 (never 0).
   * @private
   */
  faceBasisSign (tIdx, f, fIdx) {
    const fb = [1 / 3, 1 / 3, 1 / 3, 1 / 3]
    fb[f] = 0
    const phi = this.whitney.getFaceBasis(tIdx, fb)[f]
    const n = this.mesh.getFaceOutwardNormal(fIdx)
    return Math.sign(phi[0] * n[0] + phi[1] * n[1] + phi[2] * n[2])
  }

  /**
   * Pi_ring^2: interior H(div) projector with zero boundary trace.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {!Set<number>} boundaryFaceSet
   * @return {!Array<number>}
   */
  projectRing (u, point, tIdx, boundaryFaceSet) {
    const bary = this.whitney.getBarycentric(tIdx, point)
    const faceBasis = this.whitney.getFaceBasis(tIdx, bary)
    const tFaces = this.mesh.getTetrahedronFaces(tIdx)
    const result = [0, 0, 0]

    for (let f = 0; f < 4; f++) {
      const fIdx = tFaces[f]
      if (boundaryFaceSet.has(fIdx)) {
        continue
      }
      const coefficient = this.computeFaceDof(u, fIdx)
      const sign = this.faceBasisSign(tIdx, f, fIdx)
      result[0] += sign * coefficient * faceBasis[f][0]
      result[1] += sign * coefficient * faceBasis[f][1]
      result[2] += sign * coefficient * faceBasis[f][2]
    }
    return result
  }

  /**
   * E^2: discrete extension of face boundary data.
   * @param {!Map<number, number>} boundaryData
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {!Set<number>} boundaryFaceSet
   * @return {!Array<number>}
   */
  extendBoundary (boundaryData, point, tIdx, boundaryFaceSet) {
    const bary = this.whitney.getBarycentric(tIdx, point)
    const faceBasis = this.whitney.getFaceBasis(tIdx, bary)
    const tFaces = this.mesh.getTetrahedronFaces(tIdx)
    const result = [0, 0, 0]

    for (let f = 0; f < 4; f++) {
      const fIdx = tFaces[f]
      if (!boundaryFaceSet.has(fIdx) || !boundaryData.has(fIdx)) {
        continue
      }
      const coefficient = boundaryData.get(fIdx)
      result[0] += coefficient * faceBasis[f][0]
      result[1] += coefficient * faceBasis[f][1]
      result[2] += coefficient * faceBasis[f][2]
    }
    return result
  }
}
