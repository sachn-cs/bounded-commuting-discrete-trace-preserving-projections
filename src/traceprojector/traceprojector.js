/**
 * TRACEPROJECTOR: Bounded, Commuting, Discrete-trace Preserving Projections.
 *
 * Implements the de Rham projection operators Pi^l for l = 0,1,2,3 on
 * tetrahedral meshes with boundary-aware trace preservation.
 */

import { numericalGradient } from './utils.js'
import { verifyBoundaryWeights as runVerifyBoundaryWeights } from './boundaryVerify.js'
import { ProjectError } from './errors.js'
import { Weight } from './weight.js'
import { Locator } from './locator.js'
import { Bubble } from './bubble.js'
import { Refinement } from './refinement.js'
import { H1 } from './projectors/h1.js'
import { Hcurl } from './projectors/hcurl.js'
import { Hdiv } from './projectors/hdiv.js'
import { L2 } from './projectors/l2.js'

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
  mesh
  /** @type {!Whitney} */
  whitney
  /** @type {number} */
  order
  /** @type {function(string): void} */
  onWarning
  /** @type {Locator|null} */
  locator
  /** @type {!Refinement} */
  refinement
  /** @type {!Weight} */
  weight
  /** @type {!Bubble} */
  bubble
  /** @type {!H1} */
  h1
  /** @type {!Hcurl} */
  hcurl
  /** @type {!Hdiv} */
  hdiv
  /** @type {!L2} */
  l2
  /** @type {!Map<number, {pair: function, integral: number, psi: !Array<number>}>} */
  vertexBoundaryWeights
  /** @type {!Map<number, {ePair: !Array<number>, pair: function, eta: !Array<number>}>} */
  edgeBoundaryWeights
  /** @type {!Map<number, {face: !Array<number>, pair: function, nBasis: number}>} */
  faceBoundaryWeights
  /** @type {!Set<number>} */
  edgeSet
  /** @type {!Set<number>} */
  faceSet

  /**
   * @param {!Mesh} mesh
   * @param {!Whitney} whitney
   * @param {!Object=} options
   * @param {number=} options.quadratureOrder - Quadrature order for integration (default 3).
   */
  constructor (mesh, whitney, options = {}) {
    this.mesh = mesh
    this.whitney = whitney
    this.order = options.quadratureOrder || 3
    this.onWarning =
      options.onWarning || ((ctx) => console.warn(ctx.message ?? ctx))
    this.locator = null

    this.refinement = new Refinement(this.mesh)
    this.weight = new Weight(
      this.mesh,
      this.onWarning
    )

    this.edgeSet = new Set(this.mesh.getBoundaryEdges())
    this.faceSet = new Set(this.mesh.getBoundaryFaces())

    this.bubble = new Bubble(
      this.mesh,
      this.whitney,
      this.order,
      this.onWarning
    )

    this.h1 = new H1(this.mesh, this.whitney, this.refinement)
    this.hcurl = new Hcurl(this.mesh, this.whitney, this.order)
    this.hdiv = new Hdiv(this.mesh, this.whitney, this.order)
    this.l2 = new L2(this.mesh, this.whitney, this.order)

    this.validateMesh()
  }

  /** @private */
  validateMesh () {
    let degenerateCount = 0
    for (let tIdx = 0; tIdx < this.mesh.tetrahedronCount; tIdx++) {
      const vol = this.mesh.getVolume(tIdx)
      if (vol < 1e-12) {
        degenerateCount++
      }
    }
    if (degenerateCount > 0) {
      this.onWarning({
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
    return this.order
  }

  /**
   * Builds the AABB point locator for O(log N) point-in-tet queries.
   *
   * Called automatically by {@link projectAtPoint} if not already built.
   * Must be called before any operation that requires spatial queries.
   */
  buildLocator () {
    this.locator = new Locator(this.mesh)
  }

  /** @private */
  validateTetIdx (tIdx) {
    if (typeof tIdx !== 'number' || !Number.isInteger(tIdx)) {
      throw new ProjectError(`tIdx must be an integer, got ${tIdx}`)
    }
    if (tIdx < 0 || tIdx >= this.mesh.tetrahedronCount) {
      throw new ProjectError(
        `tIdx=${tIdx} out of range [0, ${this.mesh.tetrahedronCount - 1}]`
      )
    }
  }

  /** @private */
  static validatePoint (point) {
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
    if (this.refinement.alfeldTriangles.length === 0) {
      this.refinement.computeWorseyFarinSplit()
    }
    const weights = this.weight.compute()
    this.vertexBoundaryWeights = weights.vertexBoundaryWeights
    this.edgeBoundaryWeights = weights.edgeBoundaryWeights
    this.faceBoundaryWeights = weights.faceBoundaryWeights
  }

  /**
   * H1 projection (l=0) of a scalar field.
   * @param {function(!Array<number>): number} u
   * @param {!Array<number>} point
   * @param {number} tIdx
   * @return {number}
   */
  projectH1 (u, point, tIdx) {
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
    return this.h1.project(u, point, tIdx)
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
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
    return this.hcurl.project(u, point, tIdx, this.edgeSet)
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
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
    return this.hdiv.project(u, point, tIdx, this.faceSet)
  }

  /**
   * L2 projection (l=3).
   * @param {function(!Array<number>): number} u
   * @param {number} tIdx
   * @return {number}
   */
  projectL2 (u, tIdx) {
    this.validateTetIdx(tIdx)
    return this.l2.project(u, tIdx)
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
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
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
      const bary = this.whitney.getBarycentric(tIdx, point)
      const coeffs = this.bubble.solveL2Projection(
        tIdx,
        p,
        u
      )
      return this.bubble.evaluateL2Projection(
        coeffs,
        bary,
        p
      )
    }

    if (l === 3) {
      const bary = this.whitney.getBarycentric(tIdx, point)
      const coeffs = this.bubble.solveL2Projection(
        tIdx,
        p,
        u
      )
      return this.bubble.evaluateL2Projection(
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
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
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
    const samplePt = this.mesh.getTetrahedronBarycenter(tIdx)
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
      for (const vIdx of this.mesh.getBoundaryNodes()) {
        result.set(vIdx, this.h1.computeBoundaryIntegralH1(vIdx, u))
      }
    } else if (l === 1) {
      for (const eIdx of this.mesh.getBoundaryEdges()) {
        result.set(eIdx, this.hcurl.computeEdgeDof(u, eIdx))
      }
    } else if (l === 2) {
      for (const fIdx of this.mesh.getBoundaryFaces()) {
        result.set(fIdx, this.hdiv.computeFaceDof(u, fIdx))
      }
    }
    return result
  }

  /**
   * Cross-checks the projected (exact) boundary degrees of freedom against the
   * Section 6.3 boundary weights.
   *
   * The projectors evaluate boundary DoFs exactly (u(v), ∫_e u·t, ∫_f u·n),
   * which is correct for any input.  The §6.3 weights ζ reproduce these DoFs on
   * the discrete trace spaces (eqs. 6.25 / 6.31 / 6.36).  This method applies
   * each wired weight functional to its boundary simplex's canonical exact
   * trace basis field and verifies it recovers the normalized DoF (1),
   * without altering how DoFs are computed.  Call computeBoundaryWeights()
   * first.
   *
   * @param {number=} tol - Absolute tolerance (default 1e-6).
   * @return {{ok: boolean, passed: number, failing: number, checks: !Array<*>}}
   */
  verifyBoundaryWeights (tol = 1e-6) {
    return runVerifyBoundaryWeights(this, tol)
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
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
    const dispatch = {
      0: () => this.h1.projectRing(u, point, tIdx),
      1: () => this.hcurl.projectRing(u, point, tIdx, this.edgeSet),
      2: () => this.hdiv.projectRing(u, point, tIdx, this.faceSet),
      3: () => this.l2.project(u, tIdx)
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
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
    const dispatch = {
      0: () => this.h1.extendBoundary(boundaryData, point, tIdx),
      1: () => this.hcurl.extendBoundary(boundaryData, point, tIdx, this.edgeSet),
      2: () => this.hdiv.extendBoundary(boundaryData, point, tIdx, this.faceSet)
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
    Projector.validatePoint(point)
    this.validateTetIdx(tIdx)
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
    Projector.validatePoint(point)
    if (!this.locator) {
      this.buildLocator()
    }
    const found = this.locator.findTetrahedron(point)
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

export { Mesh } from './mesh.js'
export { Whitney } from './whitney.js'
export { Locator } from './locator.js'
export { Refinement } from './refinement.js'
export { Weight } from './weight.js'
export { Bubble } from './bubble.js'
export { Solver } from './solver.js'
export { ValidateError, ProjectError, SingularError } from './errors.js'
export { H1 } from './projectors/h1.js'
export { Hcurl } from './projectors/hcurl.js'
export { Hdiv } from './projectors/hdiv.js'
export { L2 } from './projectors/l2.js'
