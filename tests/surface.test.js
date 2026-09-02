/**
 * Tests for the surface differential operators and barycenter tent in
 * {@link surface.js}, verifying the paper's Section 2.3 identities:
 *   (2.10) rot_Gamma(u) = n x grad_Gamma(u)
 *   (2.14a) (curl_Gamma v, w)_Gamma = (v, rot_Gamma w)_Gamma
 *   (2.14b) (div_Gamma v, w)_Gamma = -(v, grad_Gamma w)_Gamma
 * plus the mu tent values (1 at vertices, 0 at barycenters, linear).
 */
import { expect } from 'chai'
import {
  gradGamma,
  rotGamma,
  curlGamma,
  divGamma,
  muTent,
  triangleFrame
} from '../src/lib/surface.js'
import { triangleQuadrature, barycentricToCartesian } from '../src/lib/quadrature.js'
import { dot, cross } from '../src/lib/utils.js'

const FRAMES = [
  { v0: [0, 0, 0], v1: [1, 0, 0], v2: [0, 1, 0], label: 'z=0' },
  { v0: [0, 0, 0], v1: [1, 0, 1], v2: [0, 1, 1], label: 'tilted' }
]

describe('Surface operators', () => {
  it('gradGamma is tangential (perpendicular to the face normal)', () => {
    for (const { v0, v1, v2 } of FRAMES) {
      const verts = [v0, v1, v2]
      const { normal } = triangleFrame(verts)
      const u = (p) => p[0] * p[0] + 3 * p[1] + p[2]
      const pt = [(v0[0] + v1[0] + v2[0]) / 3, (v0[1] + v1[1] + v2[1]) / 3, (v0[2] + v1[2] + v2[2]) / 3]
      const g = gradGamma(pt, verts, u)
      expect(dot(g, normal)).to.be.closeTo(0, 1e-6)
    }
  })

  it('(2.10) rotGamma = n x gradGamma', () => {
    const v0 = FRAMES[1].v0
    const v1 = FRAMES[1].v1
    const v2 = FRAMES[1].v2
    const verts = [v0, v1, v2]
    const { normal } = triangleFrame(verts)
    const u = (p) => p[0] + 2 * p[1] + 3 * p[2]
    const pt = [0.3, 0.3, 0.35]
    const rot = rotGamma(pt, verts, u)
    const nxg = cross(normal, gradGamma(pt, verts, u))
    expect(rot[0]).to.be.closeTo(nxg[0], 1e-6)
    expect(rot[1]).to.be.closeTo(nxg[1], 1e-6)
    expect(rot[2]).to.be.closeTo(nxg[2], 1e-6)
  })

  it('(2.14a) L2 identity (curlGamma v, w) = (v, rotGamma w) for w=0 on the boundary', () => {
    // On an open triangle the adjoint identity holds only up to a boundary term;
    // choosing w that vanishes on all three edges removes it.  w = lam0 lam1 lam2
    // in barycentric coordinates is zero on the boundary.
    const v0 = [0, 0, 0]
    const v1 = [1, 0, 0]
    const v2 = [0, 1, 0]
    const verts = [v0, v1, v2]
    const { tangent1: t1 } = triangleFrame(verts)
    const v = (p) => [p[1] * t1[0], p[1] * t1[1], p[1] * t1[2]]
    const w = (p) => {
      const lam0 = 1 - p[0] - p[1]
      return lam0 * p[0] * p[1]
    }
    const { bary, weights } = triangleQuadrature(3)
    let lhs = 0
    let rhs = 0
    for (let q = 0; q < bary.length; q++) {
      const pt = barycentricToCartesian(verts, bary[q])
      lhs += weights[q] * curlGamma(pt, verts, v) * w(pt)
      rhs += weights[q] * dot(v(pt), rotGamma(pt, verts, w))
    }
    expect(lhs).to.be.closeTo(rhs, 1e-6)
  })

  it('(2.14b) L2 identity (divGamma v, w) = -(v, gradGamma w) for w=0 on the boundary', () => {
    const v0 = [0, 0, 0]
    const v1 = [1, 0, 0]
    const v2 = [0, 1, 0]
    const verts = [v0, v1, v2]
    const { tangent1: t1, tangent2: t2 } = triangleFrame(verts)
    const v = (p) => [p[0] * t1[0] + p[1] * t2[0], p[0] * t1[1] + p[1] * t2[1], p[0] * t1[2] + p[1] * t2[2]]
    const w = (p) => {
      const lam0 = 1 - p[0] - p[1]
      return lam0 * p[0] * p[1]
    }
    const { bary, weights } = triangleQuadrature(3)
    let lhs = 0
    let rhs = 0
    for (let q = 0; q < bary.length; q++) {
      const pt = barycentricToCartesian(verts, bary[q])
      lhs += weights[q] * divGamma(pt, verts, v) * w(pt)
      rhs += weights[q] * dot(v(pt), gradGamma(pt, verts, w))
    }
    expect(lhs).to.be.closeTo(-rhs, 1e-6)
  })

  it('gradGamma reproduces the ambient gradient for affine functions', () => {
    const v0 = [0, 0, 0]
    const v1 = [1, 0, 1]
    const v2 = [0, 1, 1]
    const verts = [v0, v1, v2]
    const u = (p) => 2 * p[0] - p[1] + 4 * p[2]
    const pt = [0.2, 0.4, 0.3]
    const g = gradGamma(pt, verts, u)
    const { normal } = triangleFrame(verts)
    const proj = [2 - (2 * normal[0] - 1 * normal[1] + 4 * normal[2]) * normal[0],
      -1 - (2 * normal[0] - 1 * normal[1] + 4 * normal[2]) * normal[1],
      4 - (2 * normal[0] - 1 * normal[1] + 4 * normal[2]) * normal[2]]
    expect(g[0]).to.be.closeTo(proj[0], 1e-6)
    expect(g[1]).to.be.closeTo(proj[1], 1e-6)
    expect(g[2]).to.be.closeTo(proj[2], 1e-6)
  })
})

describe('Barycenter tent mu', () => {
  const face = [[0, 0, 0], [2, 0, 0], [0, 2, 0]]
  const bary = [(0 + 2 + 0) / 3, (0 + 0 + 2) / 3, 0]

  it('is 1 at every original vertex and 0 at the barycenter', () => {
    for (const v of face) {
      expect(muTent(face, bary, v)).to.be.closeTo(1, 1e-6)
    }
    expect(muTent(face, bary, bary)).to.be.closeTo(0, 1e-6)
  })

  it('is linear on the triangle (dual+midpoint), 0 at bary)', () => {
    const mid = [(2 + bary[0]) / 2, (0 + bary[1]) / 2, 0]
    expect(muTent(face, bary, mid)).to.be.closeTo(0.5, 1e-6)
  })

  it('stays within [0, 1] inside the face', () => {
    const q = triangleQuadrature(2)
    for (let i = 0; i < q.bary.length; i++) {
      const pt0 = barycentricToCartesian(face, q.bary[i])
      const mu = muTent(face, bary, pt0)
      expect(mu).to.be.at.least(-1e-6)
      expect(mu).to.be.at.most(1 + 1e-6)
    }
  })
})
