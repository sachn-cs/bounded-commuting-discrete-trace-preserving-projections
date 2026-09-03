/**
 * Boundary-weight verification (the §6.3 cascade as a checked cross-check).
 *
 * The projectors evaluate boundary degrees of freedom exactly (u(v), ∫_e u·t,
 * ∫_f u·n), which is correct for any input.  The lowest-order weights ζ_{0,σ}^l
 * built by the §6.3 cascade reproduce these same DoFs on the discrete trace
 * spaces (eqs. 6.25 / 6.31 / 6.36).  This module cross-checks that the weights,
 * as wired through {@link Weight} into {@link Projector}, do reproduce the
 * canonical DoF of the boundary simplex on its own exact trace basis field,
 * without changing how the projectors compute DoFs.
 */

import { dot, subtract, norm } from './utils.js'
import { triangleFrame } from './surface.js'
import { triangleQuadrature, barycentricToCartesian } from './quadrature.js'
/**
 * Verifies the wired boundary weights against the exact trace basis fields.
 *
 * For each boundary simplex σ the weight functional pair_σ is applied to σ's
 * canonical discrete trace basis field (the P1 hat λ_v, the Whitney 1-form W_e,
 * or the face RT_0 field) and checked against the simplex's normalized DoF
 * (equal to 1).  Mismatches beyond `tol` are collected and returned; each
 * simplex that reproduces its DoF contributes an entry to `passed`.
 *
 * @param {!Projector} projector - A Projector with computeBoundaryWeights() done.
 * @param {number=} tol - Absolute tolerance for the DoF reproduction check.
 * @return {{ok: boolean, passed: number, failing: number, checks: !Array<*>}}
 */
export function verifyBoundaryWeights (projector, tol = 1e-6) {
  if (!projector.vertexBoundaryWeights ||
      !projector.edgeBoundaryWeights ||
      !projector.faceBoundaryWeights) {
    return { ok: false, reason: 'computeBoundaryWeights() not called', passed: 0, failing: 0, checks: [] }
  }
  if (!projector.locator) projector.buildLocator()
  const mesh = projector.mesh
  const whitney = projector.whitney
  const loc = projector.locator
  const q = triangleQuadrature(5)
  const checks = []

  const locate = (p) => loc.findTetrahedron(p)

  // Vertex level (eq. 6.25): (zeta_{0,v}^0, lambda_v)_Gamma = 1.
  for (const [vIdx, vw] of projector.vertexBoundaryWeights) {
    const lam = (p) => {
      const r = locate(p)
      if (!r) return Number.NaN
      const k = mesh.getTetrahedra()[r.tIdx].indexOf(vIdx)
      return k >= 0 ? r.bary[k] : 0
    }
    const val = vw.pair(lam)
    checks.push({ l: 0, idx: vIdx, expected: 1, got: val })
  }

  // Edge level (eq. 6.31): (zeta_{0,e}^1, W_e)_Gamma = int_e W_e . t_e = 1.
  for (const [eIdx, ew] of projector.edgeBoundaryWeights) {
    const [a, b] = ew.ePair
    const u = (p) => {
      const r = locate(p)
      if (!r) return [0, 0, 0]
      const tet = mesh.getTetrahedra()[r.tIdx]
      const g = whitney.getGradBarycentric(r.tIdx)
      const ia = tet.indexOf(a)
      const ib = tet.indexOf(b)
      const la = ia >= 0 ? r.bary[ia] : 0
      const lb = ib >= 0 ? r.bary[ib] : 0
      const ga = ia >= 0 ? g[ia] : [0, 0, 0]
      const gb = ib >= 0 ? g[ib] : [0, 0, 0]
      return [
        la * gb[0] - lb * ga[0],
        la * gb[1] - lb * ga[1],
        la * gb[2] - lb * ga[2]
      ]
    }
    const val = ew.pair(u)
    checks.push({ l: 1, idx: eIdx, expected: 1, got: val })
  }

  // Face level (eq. 6.36): (zeta_{0,f}^2, RT_e)_Gamma = int_f RT_e . n.
  for (const [fIdx, fw] of projector.faceBoundaryWeights) {
    const face = fw.face
    const tv = face.map((i) => mesh.getVertices()[i])
    const rt = rtBasis(tv)
    const normals = triangulateNormal(mesh, fIdx, tv)
    for (let e = 0; e < 3; e++) {
      const val = fw.pair((pt) => rt[e](pt))
      let expected = 0
      for (let p = 0; p < q.bary.length; p++) {
        const pt = barycentricToCartesian(tv, q.bary[p])
        expected += q.weights[p] * dot(rt[e](pt), normals)
      }
      expected *= triangleAreaAbs(tv)
      checks.push({ l: 2, idx: fIdx, edge: e, expected, got: val })
    }
  }

  const failing = checks.filter((c) => Math.abs(c.got - c.expected) > tol)
  return {
    ok: failing.length === 0,
    passed: checks.length - failing.length,
    failing: failing.length,
    checks
  }
}

/**
 * Lowest-order surface Raviart-Thomas (RT_0) basis on a single face, matching
 * the construction in bweight.js: for edge e with opposite vertex p_o,
 * RT_e(x) = (|e| / (2 A)) (x - p_o) projected into the face tangent plane.
 * @param {!Array<!Array<number>>} tv
 * @return {!Array<function(number[]):!Array<number>>}
 */
function rtBasis (tv) {
  const { normal, area } = triangleFrame(tv)
  const A = area
  const eLen = [0, 1, 2].map((a) => norm(subtract(tv[(a + 1) % 3], tv[a])))
  return [0, 1, 2].map((e) => {
    const po = tv[(e + 2) % 3]
    const scale = eLen[e] / (2 * A)
    return (pt) => {
      const v = [scale * (pt[0] - po[0]), scale * (pt[1] - po[1]), scale * (pt[2] - po[2])]
      const n = v[0] * normal[0] + v[1] * normal[1] + v[2] * normal[2]
      return [v[0] - n * normal[0], v[1] - n * normal[1], v[2] - n * normal[2]]
    }
  })
}

/**
 * Outward unit normal of a boundary face, from its stored geometry.
 * @param {!Mesh} mesh
 * @param {number} fIdx
 * @param {!Array<!Array<number>>} tv
 * @return {!Array<number>}
 */
function triangulateNormal (mesh, fIdx, tv) {
  const { normal } = triangleFrame(tv)
  const stored = mesh.getFaceOutwardNormal ? mesh.getFaceOutwardNormal(fIdx) : normal
  return dot(normal, stored) >= 0 ? normal : [-normal[0], -normal[1], -normal[2]]
}

function triangleAreaAbs (tv) {
  const { area } = triangleFrame(tv)
  return Math.abs(area)
}
