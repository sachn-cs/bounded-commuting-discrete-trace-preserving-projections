/**
 * Boundary weight computation for Projector projections.
 *
 * Computes vertex patch weights, edge tangents/lengths, and face normals/areas
 * used by trace-preserving boundary DoFs.
 */

import { subtract, norm } from './utils.js'
import { vertexWeight, edgeWeight, faceWeight } from './bweight.js'

/**
 * Computes boundary patch weights used by the trace-preserving projection
 * operators.  For each boundary vertex it builds the Section 6.3 vertex
 * duality functional, and for each boundary edge/face it builds the edge/face
 * duality functionals, plus the edge tangent/length and face normal/area
 * geometry.
 *
 * Local failures (e.g. degenerate stars) emit warnings rather than throwing
 * so that a single bad element does not halt the entire mesh projection.
 */
export class Weight {
  /**
   * @param {!Mesh} mesh
   * @param {function=} onWarning - Callback invoked with a warning context
   *   object when a local weight computation fails or is ill-conditioned.
   */
  constructor (mesh, onWarning = console.warn) {
    this.mesh = mesh
    this.onWarning =
      typeof onWarning === 'function'
        ? onWarning
        : (ctx) => console.warn(ctx.message ?? ctx)
  }

  /**
   * Computes all boundary weights, including the Section 6.3 vertex/edge/face
   * duality functionals.
   * @return {Object} Boundary weight and geometry data.
   * @property {!Map<number, {v0: number, v1: number, tangent: !Array<number>, length: number}>} edgeBoundaryData
   * @property {!Map<number, {normal: !Array<number>, area: number}>} faceBoundaryData
   * @property {!Map<number, {pair: function, integral: number, psi: !Array<number>, faces: !Array<!Array<number>>}>} vertexBoundaryWeights
   * @property {!Map<number, {ePair: !Array<number>, pair: function, edges: !Array<!Array<number>>, eta: !Array<number>}>} edgeBoundaryWeights
   * @property {!Map<number, {face: !Array<number>, pair: function, nBasis: number}>} faceBoundaryWeights
   */
  compute () {
    const edgeBoundaryData = this.computeEdgeData()
    const faceBoundaryData = this.computeFaceData()
    const vertexBoundaryWeights = this.computeVertexWeights()
    const edgeBoundaryWeights = this.computeEdgeWeights()
    const faceBoundaryWeights = this.computeFaceWeights()
    return {
      edgeBoundaryData,
      faceBoundaryData,
      vertexBoundaryWeights,
      edgeBoundaryWeights,
      faceBoundaryWeights
    }
  }

  /** @private */
  computeVertexWeights () {
    const zeta0 = new Map()
    const faces = this.mesh.getFaces()
    const boundaryFaces = this.mesh.getBoundaryFaces()
    for (const vIdx of this.mesh.getBoundaryNodes()) {
      try {
        const star = boundaryFaces.filter((f) => faces[f].includes(vIdx))
        if (star.length === 0) {
          this.onWarning({
            code: 'BWC_VERTEX_NO_STAR',
            severity: 'warn',
            message: `Weight: vertex ${vIdx} has no boundary-face star; skipping.`
          })
          continue
        }
        const vw = vertexWeight(this.mesh.getVertices(), star.map((f) => faces[f]), vIdx)
        zeta0.set(vIdx, { pair: vw.pair, integral: vw.integral, psi: vw.psi, faces: vw.faces })
      } catch (err) {
        this.onWarning({
          code: 'BWC_VERTEX_BWEIGHT_FAILURE',
          severity: 'warn',
          message: `Weight: failed to compute vertex weight for vertex ${vIdx}: ${err.message}`
        })
      }
    }
    return zeta0
  }

  /** @private */
  computeEdgeWeights () {
    const zeta1 = new Map()
    const faces = this.mesh.getFaces()
    const boundaryFaces = this.mesh.getBoundaryFaces()
    for (const eIdx of this.mesh.getBoundaryEdges()) {
      const e = this.mesh.getEdges()[eIdx]
      try {
        const star = boundaryFaces.filter(
          (f) => faces[f].includes(e[0]) && faces[f].includes(e[1])
        )
        if (star.length === 0) {
          this.onWarning({
            code: 'BWC_EDGE_NO_STAR',
            severity: 'warn',
            message: `Weight: edge ${eIdx} has no boundary-face star; skipping.`
          })
          continue
        }
        const ew = edgeWeight(this.mesh.getVertices(), star.map((f) => faces[f]), e)
        zeta1.set(eIdx, {
          ePair: [e[0], e[1]],
          pair: ew.pair,
          edges: ew.edges,
          eta: ew.eta
        })
      } catch (err) {
        this.onWarning({
          code: 'BWC_EDGE_FAILURE',
          severity: 'warn',
          message: `Weight: failed to compute edge weight for edge ${eIdx}: ${err.message}`
        })
      }
    }
    return zeta1
  }

  /** @private */
  computeFaceWeights () {
    const zeta2 = new Map()
    const faces = this.mesh.getFaces()
    const boundaryFaces = this.mesh.getBoundaryFaces()
    for (const fIdx of this.mesh.getBoundaryFaces()) {
      try {
        const face = faces[fIdx]
        // Extended star: boundary faces sharing at least one vertex with f.
        const extStar = boundaryFaces.filter((g) => face.some((v) => faces[g].includes(v)))
        if (extStar.length === 0) {
          this.onWarning({
            code: 'BWC_FACE_NO_STAR',
            severity: 'warn',
            message: `Weight: face ${fIdx} has no extended star; skipping.`
          })
          continue
        }
        const fw = faceWeight(this.mesh.getVertices(), extStar.map((g) => faces[g]), face)
        zeta2.set(fIdx, { face, pair: fw.pair, nBasis: fw.nBasis })
      } catch (err) {
        this.onWarning({
          code: 'BWC_FACE_FAILURE',
          severity: 'warn',
          message: `Weight: failed to compute face weight for face ${fIdx}: ${err.message}`
        })
      }
    }
    return zeta2
  }

  /** @private */
  computeEdgeData () {
    const zeta1Edge = new Map()
    for (const eIdx of this.mesh.boundaryEdges) {
      const e = this.mesh.edges[eIdx]
      const edgeVec = subtract(this.mesh.vertices[e[1]], this.mesh.vertices[e[0]])
      const edgeLen = norm(edgeVec)
      if (edgeLen < 1e-12) {
        continue
      }
      zeta1Edge.set(eIdx, {
        v0: e[0],
        v1: e[1],
        tangent: edgeVec.map((x) => x / edgeLen),
        length: edgeLen
      })
    }
    return zeta1Edge
  }

  /** @private */
  computeFaceData () {
    const zeta2Face = new Map()
    for (const fIdx of this.mesh.boundaryFaces) {
      const normal = this.mesh.getFaceOutwardNormal(fIdx)
      const area = this.mesh.getFaceArea(fIdx)
      zeta2Face.set(fIdx, { normal, area })
    }
    return zeta2Face
  }
}
