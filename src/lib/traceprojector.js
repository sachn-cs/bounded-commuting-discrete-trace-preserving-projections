/**
 * TRACEPROJECTOR: Bounded, Commuting, Discrete-trace Preserving Projections.
 *
 * Implements the de Rham projection operators Pi^l for l = 0,1,2,3 on
 * tetrahedral meshes with boundary-aware trace preservation.
 */

import {
  numericalGradient
} from './math_utils.js'
import { ProjectError } from './errors.js'
import { Weight } from './boundary_weight_computer.js'
import { Locator } from './point_locator.js'
import { Bubble } from './higher_order_projection.js'
import { Refinement } from './mesh_refinement.js'
import { H1 } from './projectors/h1_projector.js'
import { Hcurl } from './projectors/hcurl_projector.js'
import { Hdiv } from './projectors/hdiv_projector.js'
import { L2 } from './projectors/l2_projector.js'

/**
 * TRACEPROJECTOR: Bounded, Commuting, Discrete-trace Preserving Projections.
 *
 * Implements the de Rham projection operators Pi^l for l = 0,1,2,3 on
 * tetrahedral meshes with boundary-aware trace preservation.
 *
 * **Coupling note:** This class accesses mesh data through the {@link Mesh}
 * public API (getters for vertices, faces, edges, boundary flags, orientation
 * signs, etc.).  Swapping in a different mesh implementation requires only that
 * the new class implements the same getter interface.
 */
export class Projector {
  /** @type {!Mesh} */
  _mesh
  /** @type {!Whitney} */
  _whitney
  /** @type {number} */
  _order
  /** @type {function(string): void} */
  _onWarning
  /** @type {Locator|null} */
  _locator
  /** @type {!Refinement} */
  _refinement
  /** @type {!Weight} */
  _weight
  /** @type {!Bubble} */
  _bubble
  /** @type {!H1} */
  _h1
  /** @type {!Hcurl} */
  _hcurl
  /** @type {!Hdiv} */
  _hdiv
  /** @type {!L2} */
  _l2
  /** @type {!Map<number, {nodeMap: !Array<number>, psi: !Array<number>}>} */
  _vertexData
  /** @type {!Set<number>} */
  _edgeSet
  /** @type {!Set<number>} */
  _faceSet

  /**
   * @param {!Mesh} mesh
   * @param {!Whitney} whitney
   * @param {!Object=} options
   * @param {number=} options.quadratureOrder - Quadrature order for integration (default 3).
   */
  constructor (mesh, whitney, options = {}) {
    this._mesh = mesh
    this._whitney = whitney
    this._order = options.quadratureOrder || 3
    this._onWarning =
      options.onWarning || ((ctx) => console.warn(ctx.message ?? ctx))
    this._vertexData = new Map()
    this._locator = null

    this._refinement = new Refinement(this._mesh)
    this._weight = new Weight(
      this._mesh,
      this._refinement,
      this._onWarning
    )

    this._edgeSet = new Set(this._mesh.getBoundaryEdges())
    this._faceSet = new Set(this._mesh.getBoundaryFaces())

    this._bubble = new Bubble(
      this._mesh,
      this._whitney,
      this._order,
      this._onWarning
    )

    this._h1 = new H1(this._mesh, this._whitney, this._refinement)
    this._hcurl = new Hcurl(this._mesh, this._whitney, this._order)
    this._hdiv = new Hdiv(this._mesh, this._whitney, this._order)
    this._l2 = new L2(this._mesh, this._whitney, this._order)

    this._validateMesh()
  }

  /** @private */
  _validateMesh () {
    let degenerateCount = 0
    for (let tIdx = 0; tIdx < this._mesh.tetrahedronCount; tIdx++) {
      const vol = this._mesh.getVolume(tIdx)
      if (vol < 1e-12) {
        degenerateCount++
      }
    }
    if (degenerateCount > 0) {
      this._onWarning({
        code: 'TRACEPROJECTOR_DEGENERATE_MESH',
        severity: 'warn',
        message:
          `Projector: mesh contains ${degenerateCount} degenerate or ` +
          'near-degenerate tetrahedra. Projections may fail.'
      })
    }
  }

  /** Quadrature order used for integrations. @return {number} */
  get quadratureOrder () {
    return this._order
  }

  /**
   * Builds the AABB point locator for O(log N) point-in-tet queries.
   *
   * Called automatically by {@link projectAtPoint} if not already built.
   * Must be called before any operation that requires spatial queries.
   */
  buildLocator () {
    this._locator = new Locator(this._mesh)
  }

  /** @private */
  _validateTetIdx (tIdx) {
    if (typeof tIdx !== 'number' || !Number.isInteger(tIdx)) {
      throw new ProjectError(`tIdx must be an integer, got ${tIdx}`)
    }
    if (tIdx < 0 || tIdx >= this._mesh.tetrahedronCount) {
      throw new ProjectError(
        `tIdx=${tIdx} out of range [0, ${this._mesh.tetrahedronCount - 1}]`
      )
    }
  }

  /** @private */
  static _validatePoint (point) {
    if (!Array.isArray(point) || point.length !== 3 ||
        !point.every((n) => typeof n === 'number' && Number.isFinite(n))) {
      throw new ProjectError(
        `point must be an array of 3 finite numbers, got ${JSON.stringify(point)}`
      )
    }
  }

  /**
   * Section 6.3.1: Computes boundary vertex weights for trace-preserving
   * projections.
   *
   * Triggers the Alfeld/Worsey-Farin mesh split if not already done, then
   * delegates to {@link Weight}.  Must be called before any
   * projection method that uses boundary-aware DoFs (projectH1, projectHcurl,
   * projectHdiv).
   */
  computeBoundaryWeights () {
    if (this._refinement.alfeldTriangles.length === 0) {
      this._refinement.computeWorseyFarinSplit()
    }
    const weights = this._weight.compute()
    this._vertexData = weights.vertexBoundaryData
  }

  /**
   * H1 projection (l=0) of a scalar field.
   * @param {function(!Array<number>): number} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @return {number}
   */
  projectH1 (u, point, tIdx) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    return this._h1.project(u, point, tIdx, this._vertexData)
  }

  /**
   * H(curl) projection (l=1).
   * Boundary edges use exact trace DoFs ∫_e u·t ds.
   * Interior edges use midpoint evaluation.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @return {!Array<number>}
   */
  projectHcurl (u, point, tIdx) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    return this._hcurl.project(u, point, tIdx, this._edgeSet)
  }

  /**
   * H(div) projection (l=2).
   * Boundary faces use exact trace DoFs ∫_f u·n dA.
   * Interior faces use barycenter evaluation.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @return {!Array<number>}
   */
  projectHdiv (u, point, tIdx) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    return this._hdiv.project(u, point, tIdx, this._faceSet)
  }

  /**
   * L2 projection (l=3).
   * @param {function(!Array<number>): number} u
   * @param {number} tIdx
   * @return {number}
   */
  projectL2 (u, tIdx) {
    this._validateTetIdx(tIdx)
    return this._l2.project(u, tIdx)
  }

  /**
   * Higher-order projection.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {number} l - Form degree (0=H1 scalar, 1=Hcurl vector, 2=Hdiv vector, 3=L2 scalar).
   * @param {number} p
   * @return {(number|!Array<number>)}
   */
  projectHp (u, point, tIdx, l, p) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    if (p === 0) {
      const dispatch = {
        0: () => this.projectH1(u, point, tIdx),
        1: () => this.projectHcurl(u, point, tIdx),
        2: () => this.projectHdiv(u, point, tIdx),
        3: () => this.projectL2(u, tIdx)
      }
      if (!Object.hasOwn(dispatch, l)) {
        throw new ProjectError(`Invalid form degree l=${l}`)
      }
      return dispatch[l]()
    }

    if (l === 0) {
      if (p === 1) {
        return this.projectH1(u, point, tIdx)
      }
      const bary = this._whitney.getBarycentric(tIdx, point)
      const coeffs = this._bubble.solveL2Projection(
        tIdx,
        p,
        u
      )
      return this._bubble.evaluateL2Projection(
        coeffs,
        bary,
        p
      )
    }

    if (l === 3) {
      const bary = this._whitney.getBarycentric(tIdx, point)
      const coeffs = this._bubble.solveL2Projection(
        tIdx,
        p,
        u
      )
      return this._bubble.evaluateL2Projection(
        coeffs,
        bary,
        p
      )
    }

    throw new ProjectError(
      `Higher-order projections for l=${l}, p=${p} not yet implemented. ` +
        'Only l=0 and l=3 support p>0.'
    )
  }

  /**
   * Global projector Pi^l implementing the decomposition:
   *
   *   Pi^l = Pi_partial^l + Pi_ring^l (I - Pi_partial^l)
   *
   * where Pi_partial^l is the boundary correction (discrete extension of
   * boundary DoFs) and Pi_ring^l is the interior projector with zero
   * boundary trace.  This decomposition guarantees both commuting with
   * exterior derivatives and preservation of discrete traces.
   *
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {number} l
   * @param {number=} p
   * @return {(number|!Array<number>)}
   */
  project (u, point, tIdx, l, p = 0) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    if (p !== 0) {
      return this.projectHp(u, point, tIdx, l, p)
    }
    if (l === 3) {
      return this.projectL2(u, tIdx)
    }

    // Step 1: Extract boundary DoFs (nodal values, line integrals, or fluxes).
    const boundaryData = this.extractBoundaryDofs(u, l)

    // Step 2: Pi_partial^l — discrete extension of boundary data into the element.
    const partial = this.extendBoundary(boundaryData, point, tIdx, l)

    // Step 3: Pi_ring^l — project the residual (u - Pi_partial^l) on interior DoFs.
    const samplePt = this._mesh.getTetrahedronBarycenter(tIdx)
    const isScalar = typeof u(samplePt) === 'number'

    const w = (l === 0 || !isScalar) ? u : numericalGradient.bind(this, u)

    const v = (pt) => {
      const valW = w(pt)
      const valP = this.extendBoundary(boundaryData, pt, tIdx, l)
      if (typeof valW === 'number') {
        return valW - valP
      }
      return [
        valW[0] - valP[0],
        valW[1] - valP[1],
        valW[2] - valP[2]
      ]
    }
    const ring = this.projectRing(v, point, tIdx, l)

    // Step 4: Combine: Pi^l = Pi_partial^l + Pi_ring^l(I - Pi_partial^l).
    if (typeof ring === 'number') {
      return ring + partial
    }
    return [
      ring[0] + partial[0],
      ring[1] + partial[1],
      ring[2] + partial[2]
    ]
  }

  /**
   * Extracts the boundary degrees of freedom for a given function.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {number} l
   * @return {!Map<number, number>}
   */
  extractBoundaryDofs (u, l) {
    const result = new Map()
    if (l === 0) {
      for (const vIdx of this._mesh.getBoundaryNodes()) {
        result.set(vIdx, this._h1.computeBoundaryIntegralH1(vIdx, u, this._vertexData))
      }
    } else if (l === 1) {
      for (const eIdx of this._mesh.getBoundaryEdges()) {
        result.set(eIdx, this._hcurl.computeEdgeDof(u, eIdx))
      }
    } else if (l === 2) {
      for (const fIdx of this._mesh.getBoundaryFaces()) {
        result.set(fIdx, this._hdiv.computeFaceDof(u, fIdx))
      }
    }
    return result
  }

  /**
   * Pi_ring^l: interior projector with zero boundary trace.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {number} l
   * @return {(number|!Array<number>)}
   */
  projectRing (u, point, tIdx, l) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    const dispatch = {
      0: () => this._h1.projectRing(u, point, tIdx),
      1: () => this._hcurl.projectRing(u, point, tIdx, this._edgeSet),
      2: () => this._hdiv.projectRing(u, point, tIdx, this._faceSet),
      3: () => this._l2.project(u, tIdx)
    }
    if (!Object.hasOwn(dispatch, l)) {
      throw new ProjectError(`Invalid form degree l=${l}`)
    }
    return dispatch[l]()
  }

  /**
   * E^l: discrete extension operator.
   * @param {!Map<number, number>} boundaryData
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {number} l
   * @return {(number|!Array<number>)}
   */
  extendBoundary (boundaryData, point, tIdx, l) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    const dispatch = {
      0: () => this._h1.extendBoundary(boundaryData, point, tIdx),
      1: () => this._hcurl.extendBoundary(boundaryData, point, tIdx, this._edgeSet),
      2: () => this._hdiv.extendBoundary(boundaryData, point, tIdx, this._faceSet)
    }
    if (!Object.hasOwn(dispatch, l)) {
      throw new ProjectError(
        `Discrete extension not defined for form degree l=${l}`
      )
    }
    return dispatch[l]()
  }

  /**
   * Pi_partial^l: boundary correction part of the projection.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @param {number} l
   * @return {(number|!Array<number>)}
   */
  projectPartial (u, point, tIdx, l) {
    Projector._validatePoint(point)
    this._validateTetIdx(tIdx)
    const boundaryData = this.extractBoundaryDofs(u, l)
    return this.extendBoundary(boundaryData, point, tIdx, l)
  }

  /**
   * Finds the tetrahedron containing the point and projects.
   * @param {function(!Array<number>): (number|!Array<number>)} u
   * @param {!Array<number>} point
   * @param {number=} l
   * @param {number=} p
   * @return {{value: (number|!Array<number>), tIdx: number, bary: !Array<number>}}
   */
  projectAtPoint (u, point, l = 0, p = 0) {
    Projector._validatePoint(point)
    if (!this._locator) {
      this.buildLocator()
    }
    const found = this._locator.findTetrahedron(point)
    if (!found) {
      throw new ProjectError(
        `Point [${point.join(', ')}] not found in any tetrahedron`
      )
    }
    const { tIdx, bary } = found
    return {
      value: this.projectHp(u, point, tIdx, l, p),
      tIdx,
      bary
    }
  }
}
