import { expect } from 'chai'
import { vertexWeight } from '../src/lib/bweight.js'

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

// Lagrange P1 function at node idx on the closed tetra surface: the affine
// function taking value 1 at V[idx] and 0 at the other three vertices.
function pLinear (V, idx) {
  const A = V.map((v) => [1, v[0], v[1], v[2]])
  const b = V.map((_, k) => (k === idx ? 1 : 0))
  const coeff = solve4(A, b)
  return (pt) => coeff[0] + coeff[1] * pt[0] + coeff[2] * pt[1] + coeff[3] * pt[2]
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
