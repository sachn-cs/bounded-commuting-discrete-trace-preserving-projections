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

/**
 * Builds the surface N_0 (Whitney 1-form) trace space over a collection of
 * boundary faces: a global edge indexing (with a fixed orientation) plus, for
 * each face, the mapping of its three local edges to global ids and the sign
 * aligning each local Whitney basis to the global edge orientation.
 *
 * @param {!Array<!Array<number>>} verts
 * @param {!Array<!Array<number>>} faces - Faces as global index triples.
 * @return {{edges:!Array<!Array<number>>, edgeKey:!Map<string,number>, faceEdges:!Array<!Array<number>>, faceSign:!Array<!Array<number>>}}
 */
function buildN0Space (verts, faces) {
  const key = (a, b) => (a < b ? a + ':' + b : b + ':' + a)
  const edgeMap = new Map()
  for (const f of faces) {
    for (const [a, b] of [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]]) {
      const k = key(a, b)
      if (!edgeMap.has(k)) edgeMap.set(k, [a, b])
    }
  }
  const edges = []
  const edgeKey = new Map()
  for (const [k, ab] of edgeMap.entries()) {
    edgeKey.set(k, edges.length)
    edges.push(ab)
  }
  const faceEdges = []
  const faceSign = []
  for (const f of faces) {
    const fe = []
    const fs = []
    for (const [a, b] of [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]]) {
      const ge = edgeKey.get(key(a, b))
      fe.push(ge)
      const [ga, gb] = edges[ge]
      fs.push(a === ga && b === gb ? 1 : -1)
    }
    faceEdges.push(fe)
    faceSign.push(fs)
  }
  return { edges, edgeKey, faceEdges, faceSign }
}

/**
 * Surface Whitney 1-form W_{ij} = lam_i grad lam_j - lam_j grad lam_i at a
 * point in the tangent plane of a face.
 * @param {!Array<number>} pt
 * @param {!Array<!Array<number>>} tv
 * @param {!Array<!Array<number>>} grads
 * @param {number} i
 * @param {number} j
 * @return {!Array<number>}
 */
function whitney1 (pt, tv, grads, i, j) {
  const lam = baryOnTriangle(pt, tv)
  const gi = grads[i]
  const gj = grads[j]
  return [
    lam[i] * gj[0] - lam[j] * gi[0],
    lam[i] * gj[1] - lam[j] * gi[1],
    lam[i] * gj[2] - lam[j] * gi[2]
  ]
}

/**
 * Scales a vector by s.
 * @param {!Array<number>} v
 * @param {number} s
 * @return {!Array<number>}
 */
function scaleVec (v, s) {
  return [v[0] * s, v[1] * s, v[2] * s]
}

/**
 * Edge boundary weight zeta_{0,e}^1 (Section 6.3.2), lowest-order N_0.
 *
 * On the extended star of edge e the edge DoF vector
 *
 *     d_k := int_e W_k . t_e ds
 *
 * is assembled by 1D Gauss quadrature over the featured edge, and the L2-dual
 * representative eta_e^1 solves the Whitney mass system
 *
 *     M eta_e^1 = d.
 *
 * The weight is exposed as the duality functional
 *
 *     (zeta_{0,e}^1, u)_Gamma = (eta_e^1, u) = sum_k eta_k (W_k, u)
 *
 * which is integrable for a general input 1-form u and reproduces the edge
 * degree of freedom for u whose H(curl) trace lies in N_0 (eq. 6.31):
 *
 *     (zeta_{0,e}^1, tr^1 u)_Gamma = int_e u . t_e.
 *
 * (Given this eta_e^1 the Section 6.3.2 right-hand side (6.28) vanishes on the
 * N_0 trace space, so the modal psi_e^1 term (mu_e curl psi, curl u) drops out
 * and the L2-dual alone reproduces (6.31).)
 *
 * @param {!Array<!Array<number>>} verts
 * @param {!Array<!Array<number>>} faces - Faces of the edge star.
 * @param {!Array<number>} ePair - Featured edge as a global vertex pair.
 * @return {{pair:function(function(number[]):!Array<number>):number, edges:!Array<!Array<number>>, eta:!Array<number>}}
 */
export function edgeWeight (verts, faces, ePair) {
  if (ePair.length !== 2) throw new Error('edgeWeight: ePair must be a vertex pair')
  const n0 = buildN0Space(verts, faces)
  const { edges, faceEdges, faceSign } = n0
  const ne = edges.length
  const q = triangleQuadrature(5)

  const frs = faces.map((face) => {
    const tv = face.map((i) => verts[i])
    const grads = [0, 1, 2].map((i) => {
      const c = [0, 0, 0]
      c[i] = 1
      return gradP1(tv, c)
    })
    const { area } = triangleFrame(tv)
    return { face, tv, grads, areaAbs: Math.abs(area) }
  })

  // Whitney mass matrix M[ge][gf] = (W_ge, W_gf)_star.
  const M = star2(ne)
  for (let fi = 0; fi < frs.length; fi++) {
    const fr = frs[fi]
    const fe = faceEdges[fi]
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        let mint = 0
        for (let p = 0; p < q.bary.length; p++) {
          const pt = barycentricToCartesian(fr.tv, q.bary[p])
          const wa = scaleVec(whitney1(pt, fr.tv, fr.grads, a % 3, (a + 1) % 3), faceSign[fi][a])
          const wb = scaleVec(whitney1(pt, fr.tv, fr.grads, b % 3, (b + 1) % 3), faceSign[fi][b])
          mint += q.weights[p] * dot(wa, wb)
        }
        M[fe[a]][fe[b]] += mint * fr.areaAbs
      }
    }
  }

  // Featured edge: endpoints, length, and the closed-form edge moments
  // d_k = int_e W_k . t_e ds.
  const pa = verts[ePair[0]]
  const pb = verts[ePair[1]]
  const eLen = norm(subtract(pb, pa))

  // For the surface Whitney 1-form W_ab = lam_a grad lam_b - lam_b grad lam_a,
  // the featured edge moment is intrinsic: along (p,q), grad lam_i . t_e =
  // (delta_{i,q} - delta_{i,p}) / eLen and lam_i varies linearly from delta_{i,p}
  // to delta_{i,q}.  The length scale cancels, giving
  //   d_k = int_0^1 [ lam_a(t) (d_{b,q}-d_{b,p}) - lam_b(t) (d_{a,q}-d_{a,p}) ] dt
  // with lam_a(t) = d_{a,p}(1-t) + d_{a,q} t.
  const d = new Array(ne).fill(0)
  for (let gk = 0; gk < ne; gk++) {
    const [a, b] = edges[gk]
    const dap = a === ePair[0] ? 1 : 0
    const daq = a === ePair[1] ? 1 : 0
    const dbp = b === ePair[0] ? 1 : 0
    const dbq = b === ePair[1] ? 1 : 0
    const gbt = (dbq - dbp) / eLen
    const gat = (daq - dap) / eLen
    // integrate over t in [0,1]: lam_a(t) = dap*(1-t)+daq*t, lam_b similarly
    const Ia = 0.5 * (dap + daq) // int_0^1 lam_a
    const Ib = 0.5 * (dbp + dbq) // int_0^1 lam_b
    d[gk] = (Ia * gbt - Ib * gat) * eLen
  }

  // eta_e^1 = M^{-1} d.
  const eta = luSolve(M.map((r) => r.slice()), d.slice())

  // Duality functional: (zeta, u) = (eta, u) = sum_k eta_k (W_k, u).
  const pair = (u) => {
    const fun = new Array(ne).fill(0)
    for (let fi = 0; fi < frs.length; fi++) {
      const fr = frs[fi]
      const fe = faceEdges[fi]
      for (let le = 0; le < 3; le++) {
        const gej = fe[le]
        let it = 0
        for (let p = 0; p < q.bary.length; p++) {
          const pt = barycentricToCartesian(fr.tv, q.bary[p])
          const w = scaleVec(whitney1(pt, fr.tv, fr.grads, le % 3, (le + 1) % 3), faceSign[fi][le])
          it += q.weights[p] * dot(w, u(pt))
        }
        fun[gej] += it * fr.areaAbs
      }
    }
    let val = 0
    for (let j = 0; j < ne; j++) val += eta[j] * fun[j]
    return val
  }

  return { pair, edges, eta }
}
