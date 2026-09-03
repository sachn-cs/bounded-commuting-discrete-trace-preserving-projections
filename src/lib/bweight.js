/**
 * Sequential boundary weight cascade (Section 6.3).
 *
 * Constructs the lowest-order boundary weights
 *
 *     zeta_{0,v}^0  ->  zeta_{0,e}^1  ->  zeta_{0,f}^2
 *
 * with staggered trace spaces V_0^0=P_1, V_0^1=N_0, V_0^2=RT_0 on the
 * (Alfeld-split) boundary, so that the L2-dual reproduces the canonical trace
 * degree of freedom (eqs 6.25 / 6.31 / 6.36):
 *
 *     (zeta_{0,sigma}^l, tr^l u)_Gamma = phi_sigma(u).
 *
 * Each zeta is a distribution supported on the extended star (it carries an L2
 * part plus edge Dirac layers), so it is exposed as a duality functional
 *
 *     u -> (eta, u) +/- (mu (grad|curl|rot) psi, (grad|curl|rot) u)
 *
 * which is the correct, integrable weak form (proof of Lemma 6.2).
 */

import { dot, cross, subtract, norm, zeros, luSolve } from './utils.js'
import { triangleFrame } from './surface.js'
import { triangleQuadrature, barycentricToCartesian } from './quadrature.js'
import { muTent } from './surface.js'

const star2 = (n) => Array.from({ length: n }, () => new Array(n).fill(0))

/**
 * Solves the bordered system for a kernel Lagrange-multiplier constraint:
 *     K x + alg * k = b,  (k, x) = 0.
 * @param {!Array<!Array<number>>} K
 * @param {!Array<number>} b
 * @param {!Array<number>} k
 * @return {!Array<number>}
 */
function solveConstrained (K, b, k) {
  const n = K.length
  const B = K.map((row, i) => [...row, k[i]])
  const last = [...k, 0]
  B.push(last)
  return luSolve(B, [...b, 0]).slice(0, n)
}

/**
 * Per-face P1 assembly record.
 * @param {!Array<!Array<number>>} tv
 * @param {!Array<number>} face
 * @return {!Object}
 */
function faceRec (tv, face) {
  const { area } = triangleFrame(tv)
  const grads = [0, 1, 2].map((i) => {
    const c = [0, 0, 0]
    c[i] = 1
    return gradP1(tv, c)
  })
  return { tv, face, areaAbs: Math.abs(area), grads }
}

/**
 * Gradient of the P1 function with nodal values coeff on triangle tv.
 * @param {!Array<!Array<number>>} tv
 * @param {!Array<number>} coeff
 * @return {!Array<number>}
 */
function gradP1 (tv, coeff) {
  const e1 = subtract(tv[1], tv[0])
  const e2 = subtract(tv[2], tv[0])
  const d1 = coeff[1] - coeff[0]
  const d2 = coeff[2] - coeff[0]
  const a11 = dot(e1, e1)
  const a12 = dot(e1, e2)
  const a22 = dot(e2, e2)
  const det = a11 * a22 - a12 * a12
  if (Math.abs(det) < 1e-24) return [0, 0, 0]
  const c1 = (d1 * a22 - d2 * a12) / det
  const c2 = (a11 * d2 - a12 * d1) / det
  return [c1 * e1[0] + c2 * e2[0], c1 * e1[1] + c2 * e2[1], c1 * e1[2] + c2 * e2[2]]
}

/**
 * Barycentric coordinates of a point in a triangle (area ratios).
 * @param {!Array<number>} pt
 * @param {!Array<!Array<number>>} tv
 * @return {!Array<number>}
 */
function baryOnTriangle (pt, tv) {
  const v0 = tv[0]
  const v1 = tv[1]
  const v2 = tv[2]
  const a0 = norm(cross(subtract(v1, pt), subtract(v2, pt)))
  const a1 = norm(cross(subtract(v2, pt), subtract(v0, pt)))
  const a2 = norm(cross(subtract(v0, pt), subtract(v1, pt)))
  const total = a0 + a1 + a2
  if (total < 1e-30) return [1 / 3, 1 / 3, 1 / 3]
  return [a0 / total, a1 / total, a2 / total]
}

/**
 * Integrates scalar f over a face using barycentric quadrature.
 * @param {!Object} fr
 * @param {function(number[]):number} f
 * @param {number} order
 * @return {number}
 */
function faceInt (fr, f, order = 5) {
  const q = triangleQuadrature(order)
  let s = 0
  for (let p = 0; p < q.bary.length; p++) {
    s += q.weights[p] * f(barycentricToCartesian(fr.tv, q.bary[p]))
  }
  return s * fr.areaAbs
}

/**
 * Vertex boundary weight zeta_{0,v}^0 (Section 6.3.1).
 *
 * Solves (6.22) for psi_v^0 in the mean-zero complement of P1 on the boundary
 * star of v:
 *     (mu_v grad psi, grad u)_star = phi_v^partial(u) - (eta_v^0, u)_star
 * where eta_v^0 := 1/|es_partial(v)| (constant on the star) and mu_v :=
 * chi_{es_d(v)} mu is the Section 6.3 barycenter tent mu (eq. 6.21) restricted
 * to the vertex star: 1 at each star-face barycenter, 0 on the star boundary.
 *
 * The weight is exposed as the duality functional (Lemma 6.2)
 *     (zeta_{0,v}^0, u)_Gamma = (eta,u) + (mu_v grad psi, grad u)
 * which reproduces phi_v^partial(u) = u(v) for P1 u.
 *
 * @param {!Array<!Array<number>>} verts - Coords of the star's vertices.
 * @param {!Array<!Array<number>>} faces - Star faces as index triples.
 * @param {number} vIdx - Index of v in verts.
 * @return {{pair:function(function(number[]):number):number, integral:number}}
 */
export function vertexWeight (verts, faces, vIdx) {
  const n = verts.length
  const frs = faces.map((face) => faceRec(face.map((i) => verts[i]), face))
  const totalArea = frs.reduce((s, fr) => s + fr.areaAbs, 0)
  const q = triangleQuadrature(5)

  // Weighted stiffness K[gi][gj] = (mu_v grad lam_gi, grad lam_gj)_star.
  const K = star2(n)
  for (const fr of frs) {
    const { face, tv, grads, areaAbs } = fr
    const barycenter = [
      (tv[0][0] + tv[1][0] + tv[2][0]) / 3,
      (tv[0][1] + tv[1][1] + tv[2][1]) / 3,
      (tv[0][2] + tv[1][2] + tv[2][2]) / 3
    ]
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        let ks = 0
        for (let p = 0; p < q.bary.length; p++) {
          const pt = barycentricToCartesian(tv, q.bary[p])
          const mu = muTent(tv, barycenter, pt)
          ks += q.weights[p] * mu * dot(grads[a], grads[b])
        }
        K[face[a]][face[b]] += ks * areaAbs
      }
    }
  }

  // eta functional (eta,u) = (1/|S|) int_star u.
  const Eta = new Array(n).fill(0)
  for (const fr of frs) {
    for (let a = 0; a < 3; a++) {
      Eta[fr.face[a]] += faceInt(fr, (p) => lamOf(p, fr.tv, a), 5) / totalArea
    }
  }

  // F(u) = phi_v^partial(u) - (eta,u); phi(u) = u(v).
  const F = new Array(n).fill(0)
  F[vIdx] = 1
  for (let i = 0; i < n; i++) F[i] -= Eta[i]

  const psi = solveConstrained(K, F, new Array(n).fill(1))

  // Duality functional (Lemma 6.2): (zeta,u) = (eta,u) + (mu grad psi, grad u).
  const pair = (u) => {
    let val = (1 / totalArea) * areaIntegralScalar(frs, (p) => u(p), q)
    for (const fr of frs) {
      const { face, tv } = fr
      const gps = gradP1(tv, face.map((i) => psi[i]))
      // grad u: constant on face = grad of the P1 interpolant of u at nodes.
      const gu = gradP1(tv, face.map((i) => u(verts[i])))
      // (mu grad psi, grad u): integrate mu (barycenter tent) over the face.
      const barycenter = [
        (tv[0][0] + tv[1][0] + tv[2][0]) / 3,
        (tv[0][1] + tv[1][1] + tv[2][1]) / 3,
        (tv[0][2] + tv[1][2] + tv[2][2]) / 3
      ]
      const intMu = faceInt(fr, (p) => muTent(tv, barycenter, p), 5)
      val += intMu * dot(gps, gu)
    }
    return val
  }

  return { pair, integral: 1, psi, faces }
}

/**
 * Integrates a scalar over all faces.
 * @param {!Array<!Object>} frs
 * @param {function(number[]):number} f
 * @param {!Object} q
 * @return {number}
 */
function integrateScalar (frs, f, q) {
  return areaIntegralScalar(frs, f, q)
}

/**
 * Area-weighted integral of a scalar over all faces.
 * @param {!Array<!Object>} frs
 * @param {function(number[]):number} f
 * @param {!Object} q
 * @return {number}
 */
function areaIntegralScalar (frs, f, q) {
  let s = 0
  for (const fr of frs) {
    s += fr.areaAbs * integrateScalar1(fr, f, q)
  }
  return s
}

/**
 * Integrates over a single face (area-weighted).
 * @param {!Object} fr
 * @param {function(number[]):number} f
 * @param {!Object} q
 * @return {number}
 */
function integrateScalar1 (fr, f, q) {
  let s = 0
  for (let p = 0; p < q.bary.length; p++) {
    s += q.weights[p] * f(barycentricToCartesian(fr.tv, q.bary[p]))
  }
  return s
}

/**
 * Local (face) barycentric coordinate value of a point for node index a.
 * @param {!Array<number>} pt
 * @param {!Array<!Array<number>>} tv
 * @param {number} a
 * @return {number}
 */
function lamOf (pt, tv, a) {
  return baryOnTriangle(pt, tv)[a]
}
