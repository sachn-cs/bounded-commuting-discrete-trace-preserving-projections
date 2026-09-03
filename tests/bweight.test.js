import { expect } from 'chai'
import { vertexWeight, edgeWeight, faceWeight } from '../src/traceprojector/bweight.js'
import { triangleQuadrature, barycentricToCartesian } from '../src/traceprojector/quadrature.js'

// Closed boundary of a tetrahedron: 4 vertices, 4 faces (each area 0.5).
const V = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
]
const faces = [
  [0, 1, 2],
  [0, 2, 3],
  [1, 3, 2],
  [0, 3, 1]
]
const vIdx = 0
const starFaces = faces.filter((f) => f.includes(vIdx))

describe('Vertex boundary weight zeta_{0,v}^0 (Section 6.3.1)', () => {
  // Assert (zeta_{0,v}^0, lambda_j)_Gamma = lambda_j(v) = delta_{j,v}.
  // lambda_j is the global P1 hat at node j on the closed surface.
  // zeta is supported on the star, so the pairing is over the star.
  it('reproduces phi_v^partial(u)=u(v): (zeta, lambda_j) = delta_{j0}', () => {
    const weight = vertexWeight(V, starFaces, vIdx)
    for (let j = 0; j < 4; j++) {
      const lam = pLinear(V, j)
      const lhs = weight.pair((pt) => lam(pt))
      const expected = j === vIdx ? 1 : 0
      expect(lhs).to.be.closeTo(expected, 1e-6)
    }
  })

  it('dual of constant: (zeta, 1)_Gamma = 1', () => {
    const weight = vertexWeight(V, starFaces, vIdx)
    expect(weight.pair(() => 1)).to.be.closeTo(1, 1e-6)
  })

  it('pair is linear in u', () => {
    const weight = vertexWeight(V, starFaces, vIdx)
    const a = () => 0.3
    const b = () => 0.7
    expect(weight.pair((p) => a(p) + b(p))).to.be.closeTo(weight.pair(a) + weight.pair(b), 1e-9)
  })
})

describe('Edge boundary weight zeta_{0,e}^1 (Section 6.3.2)', () => {
  const ePair = [0, 1]
  const edgeStar = faces.filter((f) => f.includes(ePair[0]) && f.includes(ePair[1]))
  const weight = edgeWeight(V, edgeStar, ePair)

  it('pair(W_k) = int_e W_k . t_e (eq. 6.31) for every star edge', () => {
    for (const ge of weight.edges) {
      const [sa, sb] = ge
      if (!(edgeStar.some((f) => f.includes(sa) && f.includes(sb)))) continue
      // Independent edge-moment quadrature over the featured edge ePair.
      const dk = pEdgeMoment(ge, ePair)
      // (zeta, W_k) via the weight acting on the global Whitney 1-form of ge.
      const lhs = weight.pair((pt) => pWhitney(pt, sa, sb))
      expect(lhs).to.be.closeTo(dk, 1e-6)
    }
  })

  it('featured edge circulation is nonzero and the identity holds', () => {
    const d0 = pEdgeMoment(ePair, ePair)
    expect(Math.abs(d0)).to.be.at.least(1e-8)
    const lhs = weight.pair((pt) => pWhitney(pt, ePair[0], ePair[1]))
    expect(lhs).to.be.closeTo(d0, 1e-6)
  })

  it('pair reproduces int_e u . t_e for an N_0-trace field (eq. 6.31)', () => {
    // A linear combination of the global surface Whitney 1-forms on the star:
    // its H(curl) trace lies in N_0, where the L2-dual is exact.
    const gePairs = weight.edges.filter(([sa, sb]) =>
      edgeStar.some((f) => f.includes(sa) && f.includes(sb))
    )
    const coeffs = gePairs.map((_, k) => 0.5 + 0.1 * k)
    const u = (pt) => {
      let acc = [0, 0, 0]
      for (let k = 0; k < gePairs.length; k++) {
        const w = pWhitney(pt, gePairs[k][0], gePairs[k][1])
        acc = [acc[0] + coeffs[k] * w[0], acc[1] + coeffs[k] * w[1], acc[2] + coeffs[k] * w[2]]
      }
      return acc
    }
    const lhs = weight.pair(u)
    let rhs = 0
    for (let k = 0; k < gePairs.length; k++) {
      rhs += coeffs[k] * pEdgeMoment(gePairs[k], ePair)
    }
    expect(lhs).to.be.closeTo(rhs, 1e-6)
  })
})

describe('Face boundary weight zeta_{0,f}^2 (Section 6.3.3)', () => {
  // On a closed tetrahedron the extended star of any face is the whole surface.
  const fFace = [0, 1, 2]
  const weight = faceWeight(V, faces, fFace)
  const q = triangleQuadrature(5)

  // Independent lowest-order surface RT_0 basis on face (fi, edge e), with the
  // featured-face outward normal moment d_k = int_f RT_k . n.
  const facePhone = (fi) => {
    const tv = faces[fi].map((i) => V[i])
    const areaN = cross3(sub3(tv[1], tv[0]), sub3(tv[2], tv[0]))
    const area = 0.5 * Math.sqrt(dot3(areaN, areaN))
    const nrm = [areaN[0] / (2 * area), areaN[1] / (2 * area), areaN[2] / (2 * area)]
    const eLen = [0, 1, 2].map((a) =>
      Math.sqrt(dot3(sub3(tv[(a + 1) % 3], tv[a]), sub3(tv[(a + 1) % 3], tv[a]))))
    const phi = (pt, e) => {
      const po = tv[(e + 2) % 3]
      const s = eLen[e] / (2 * area)
      const v = [s * (pt[0] - po[0]), s * (pt[1] - po[1]), s * (pt[2] - po[2])]
      const nn = v[0] * nrm[0] + v[1] * nrm[1] + v[2] * nrm[2]
      return [v[0] - nn * nrm[0], v[1] - nn * nrm[1], v[2] - nn * nrm[2]]
    }
    return { tv, nrm, area, phi, eLen }
  }

  // Featured face index by (sorted) vertex triple.
  const fif = faces.findIndex((fr) => sortKey(fr) === sortKey(fFace))
  const feat = facePhone(fif)

  it('pair(RT_k) = int_f RT_k . n (eq. 6.36) for every RT_0 basis field', () => {
    for (let fi = 0; fi < faces.length; fi++) {
      const ph = facePhone(fi)
      for (let e = 0; e < 3; e++) {
        const lhs = weight.pair((pt) => ph.phi(pt, e))
        let dk = 0
        if (fi === fif) {
          for (let p = 0; p < q.bary.length; p++) {
            const pt = barycentricToCartesian(feat.tv, q.bary[p])
            dk += q.weights[p] * dot3(ph.phi(pt, e), feat.nrm) * feat.area
          }
        }
        expect(lhs).to.be.closeTo(dk, 1e-6)
      }
    }
  })

  it('pair reproduces int_f u . n for an RT_0-trace field (eq. 6.36)', () => {
    const coeffs = [0.4, -0.7, 1.1]
    const u = (pt) => {
      const acc = [0, 0, 0]
      for (let e = 0; e < 3; e++) {
        const rb = feat.phi(pt, e)
        acc[0] += coeffs[e] * rb[0]
        acc[1] += coeffs[e] * rb[1]
        acc[2] += coeffs[e] * rb[2]
      }
      return acc
    }
    let rhs = 0
    for (let p = 0; p < q.bary.length; p++) {
      const pt = barycentricToCartesian(feat.tv, q.bary[p])
      rhs += q.weights[p] * dot3(u(pt), feat.nrm) * feat.area
    }
    expect(weight.pair(u)).to.be.closeTo(rhs, 1e-6)
  })
})

function cross3 (a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
function sub3 (a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function dot3 (a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
function sortKey (f) {
  return [...f].sort((x, y) => x - y).join(':')
}
function pLinear (V, idx) {
  const A = V.map((v) => [1, v[0], v[1], v[2]])
  const b = V.map((_, k) => (k === idx ? 1 : 0))
  const coeff = solve4(A, b)
  return (pt) => coeff[0] + coeff[1] * pt[0] + coeff[2] * pt[1] + coeff[3] * pt[2]
}

// Constant 3D gradient of the global Lagrange hat at node idx.
function pGrad (V, idx) {
  const A = V.map((v) => [1, v[0], v[1], v[2]])
  const b = V.map((_, k) => (k === idx ? 1 : 0))
  const coeff = solve4(A, b)
  return [coeff[1], coeff[2], coeff[3]]
}

// Global Whitney 1-form of surface edge (a,b): lam_a grad lam_b - lam_b grad lam_a.
// Evaluated pointwise; only the tangential part enters the pair inner product.
function pWhitney (pt, a, b) {
  const la = pLinear(V, a)(pt)
  const lb = pLinear(V, b)(pt)
  const ga = pGrad(V, a)
  const gb = pGrad(V, b)
  return [la * gb[0] - lb * ga[0], la * gb[1] - lb * ga[1], la * gb[2] - lb * ga[2]]
}

// 1D Gauss-Legendre on [0,1] with 6 points (for edge moments).
const GL = {
  pts: [0.033765242898424, 0.169395306766868, 0.380690406958402,
    0.619309593041598, 0.830604693233132, 0.966234757101576],
  wts: [0.085662246189585, 0.180380786524069, 0.233956967286345,
    0.233956967286345, 0.180380786524069, 0.085662246189585]
}

// Moment int_e W_ab . t_e ds of the Whitney 1-form for edge (a,b) along the
// featured edge ePair=(p,q).
function pEdgeMoment (ab, ePair) {
  const [p, q] = ePair
  const dx = V[q][0] - V[p][0]
  const dy = V[q][1] - V[p][1]
  const dz = V[q][2] - V[p][2]
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const te = [dx / len, dy / len, dz / len]
  let s = 0
  for (let i = 0; i < GL.pts.length; i++) {
    const t = GL.pts[i]
    const pt = [V[p][0] + t * dx, V[p][1] + t * dy, V[p][2] + t * dz]
    const w = pWhitney(pt, ab[0], ab[1])
    s += GL.wts[i] * (w[0] * te[0] + w[1] * te[1] + w[2] * te[2]) * len
  }
  return s
}

// 4x4 linear solve with Gaussian elimination + partial pivoting.
function solve4 (A, b) {
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < 4; c++) {
    let piv = c
    for (let r = c + 1; r < 4; r++) {
      if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
    }
    ;[M[c], M[piv]] = [M[piv], M[c]]
    const d = M[c][c]
    for (let j = c; j <= 4; j++) M[c][j] /= d
    for (let r = 0; r < 4; r++) {
      if (r === c) continue
      const f = M[r][c]
      for (let j = c; j <= 4; j++) M[r][j] -= f * M[c][j]
    }
  }
  return M.map((row) => row[4])
}
