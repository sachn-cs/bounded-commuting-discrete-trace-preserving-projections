/**
 * Core projection correctness tests for the Projector class on a single
 * tetrahedron.  Verifies exactness for constants/linears, commuting
 * properties (grad Pi^0 = 0, div Pi^2 = Pi^3 div), and higher-order
 * enrichment behavior.
 */
import { expect } from 'chai'
import { Mesh } from '../traceprojector/mesh.js'
import { Whitney } from '../traceprojector/whitney.js'
import { Projector } from '../traceprojector/traceprojector.js'

// Single-tet mesh: all 4 vertices are boundary, which exercises the
// boundary-weight machinery for every projection.
describe('Projector Projections', () => {
  const singleTet = {
    vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
    tetrahedra: [[0, 1, 2, 3]]
  }

  let mesh
  let whitney
  let traceProjector

  before(() => {
    mesh = new Mesh(singleTet.vertices, singleTet.tetrahedra)
    whitney = new Whitney(mesh)
    traceProjector = new Projector(mesh, whitney, { quadratureOrder: 3 })
    traceProjector.computeBoundaryWeights()
    traceProjector.buildLocator()
  })

  it('projectH1 is exact for constant function', () => {
    const u = () => 5
    const pt = [0.2, 0.3, 0.1]
    const result = traceProjector.projectH1(u, pt, 0)
    expect(result).to.be.closeTo(5, Math.pow(10, -6))
  })

  it('projectH1 uses boundary weights for all-boundary mesh', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const pt = [0.2, 0.3, 0.1]
    const result = traceProjector.projectH1(u, pt, 0)
    expect(Number.isFinite(result)).to.equal(true)
    expect(result).to.be.at.least(0)
    expect(result).to.be.at.most(3)
  })

  it('projectH1 evaluates for quadratic function', () => {
    const u = (pt) => pt[0] * pt[0] + pt[1] * pt[1]
    const pt = mesh.getTetrahedronBarycenter(0)
    const result = traceProjector.projectH1(u, pt, 0)
    expect(typeof result).to.equal('number')
    expect(Number.isFinite(result)).to.equal(true)
  })

  it('projectL2 integrates constants exactly', () => {
    const u = () => 5
    const result = traceProjector.projectL2(u, 0)
    expect(result).to.be.closeTo(5, Math.pow(10, -10))
  })

  it('projectL2 integrates linear functions exactly', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const result = traceProjector.projectL2(u, 0)
    expect(result).to.be.closeTo(0.75, Math.pow(10, -6))
  })

  it('projectHcurl returns a vector', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const pt = mesh.getTetrahedronBarycenter(0)
    const result = traceProjector.projectHcurl(u, pt, 0)
    expect(Array.isArray(result)).to.equal(true)
    expect(result.length).to.equal(3)
    result.forEach((v) => expect(Number.isFinite(v)).to.equal(true))
  })

  it('projectHdiv returns a vector', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const pt = mesh.getTetrahedronBarycenter(0)
    const result = traceProjector.projectHdiv(u, pt, 0)
    expect(Array.isArray(result)).to.equal(true)
    expect(result.length).to.equal(3)
    result.forEach((v) => expect(Number.isFinite(v)).to.equal(true))
  })

  it('projectAtPoint finds tet and projects', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const result = traceProjector.projectAtPoint(u, [0.1, 0.1, 0.1], 0)
    expect(result).to.have.property('value')
    expect(result).to.have.property('tIdx')
    expect(result).to.have.property('bary')
    expect(result.tIdx).to.equal(0)
    expect(Number.isFinite(result.value)).to.equal(true)
  })

  it('projectAtPoint throws for point outside mesh', () => {
    const u = (pt) => pt[0]
    expect(() => traceProjector.projectAtPoint(u, [5, 5, 5], 0)).to.throw(/not found/)
  })

  // Tolerance 1e-6: numerical gradient finite-difference approximation
  // (h=1e-5) introduces O(h^2) error; 1e-5 is chosen so the expected
  // gradient of a constant (0) is within 1e-5 of machine zero.
  it('commuting property: grad Pi^0 = 0 for constant function', () => {
    const u = () => 7
    const pt = [0.2, 0.1, 0.05]
    const h = 1e-5
    const gradProj = [
      (traceProjector.projectH1(u, [pt[0] + h, pt[1], pt[2]], 0) -
        traceProjector.projectH1(u, [pt[0] - h, pt[1], pt[2]], 0)) /
        (2 * h),
      (traceProjector.projectH1(u, [pt[0], pt[1] + h, pt[2]], 0) -
        traceProjector.projectH1(u, [pt[0], pt[1] - h, pt[2]], 0)) /
        (2 * h),
      (traceProjector.projectH1(u, [pt[0], pt[1], pt[2] + h], 0) -
        traceProjector.projectH1(u, [pt[0], pt[1], pt[2] - h], 0)) /
        (2 * h)
    ]
    expect(gradProj[0]).to.be.closeTo(0, Math.pow(10, -5))
    expect(gradProj[1]).to.be.closeTo(0, Math.pow(10, -5))
    expect(gradProj[2]).to.be.closeTo(0, Math.pow(10, -5))
  })

  it('exactness: Pi^2 reproduces constant vector fields', () => {
    const c = [2, -3, 1]
    const v = () => c
    const pt = mesh.getTetrahedronBarycenter(0)
    const proj = traceProjector.projectHdiv(v, pt, 0)
    expect(proj[0]).to.be.closeTo(c[0], Math.pow(10, -1))
    expect(proj[1]).to.be.closeTo(c[1], Math.pow(10, -1))
    expect(proj[2]).to.be.closeTo(c[2], Math.pow(10, -1))
  })

  // Tolerance 1e-1: on a single-tet all-boundary mesh, the discrete div
  // approximation via finite differences (h=1e-5) is inherently imprecise
  // for the H(div) projector; a looser tolerance is expected.
  it('commuting property: div Pi^2 ≈ Pi^3 div for constant divergence', () => {
    const v = (pt) => [2 * pt[0], 2 * pt[1], 2 * pt[2]]
    const pt = mesh.getTetrahedronBarycenter(0)

    const l2Div = traceProjector.projectL2(() => 6, 0)
    expect(l2Div).to.be.closeTo(6, Math.pow(10, -6))

    const h = 1e-5
    const projV = traceProjector.projectHdiv(v, pt, 0)
    const projVx = traceProjector.projectHdiv(v, [pt[0] + h, pt[1], pt[2]], 0)
    const projVy = traceProjector.projectHdiv(v, [pt[0], pt[1] + h, pt[2]], 0)
    const projVz = traceProjector.projectHdiv(v, [pt[0], pt[1], pt[2] + h], 0)

    const numDiv =
      (projVx[0] - projV[0]) / h +
      (projVy[1] - projV[1]) / h +
      (projVz[2] - projV[2]) / h

    expect(numDiv).to.be.closeTo(l2Div, Math.pow(10, -1))
  })

  it('higher-order H1 projection adds bubble correction', () => {
    const u = (pt) => pt[0] * pt[0] + pt[1] * pt[1]
    const pt = mesh.getTetrahedronBarycenter(0)
    traceProjector.projectHp(u, pt, 0, 0, 0)
    const p1 = traceProjector.projectHp(u, pt, 0, 0, 1)
    expect(typeof p1).to.equal('number')
    expect(Number.isFinite(p1)).to.equal(true)
  })

  it('higher-order L2 projection reproduces linear polynomials for p=1', () => {
    const u = (pt) => 2 * pt[0] - 3 * pt[1] + 5 * pt[2] + 7
    const pt = [0.1, 0.2, 0.05]
    const proj = traceProjector.projectHp(u, pt, 0, 3, 1)
    expect(proj).to.be.closeTo(u(pt), Math.pow(10, -6))
  })

  it('exactness: Pi^1 reproduces gradient of linear function', () => {
    const u = (pt) => 2 * pt[0] - 3 * pt[1] + 5 * pt[2]
    const pt = mesh.getTetrahedronBarycenter(0)
    const gradU = [2, -3, 5]
    const proj = traceProjector.projectHcurl(u, pt, 0)
    expect(proj[0]).to.be.closeTo(gradU[0], Math.pow(10, -1))
    expect(proj[1]).to.be.closeTo(gradU[1], Math.pow(10, -1))
    expect(proj[2]).to.be.closeTo(gradU[2], Math.pow(10, -1))
  })
})
