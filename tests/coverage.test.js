/**
 * Broad coverage and edge-case tests: multi-tet projection correctness,
 * mesh validation errors, higher-order edge cases, singular-matrix handling,
 * and scalar-to-vector projection interoperability.
 */
import { expect } from 'chai'
import sinon from 'sinon'
import { Mesh } from '../src/lib/mesh.js'
import { Whitney } from '../src/lib/whitney.js'
import { Projector } from '../src/lib/traceprojector.js'
import { Bubble } from '../src/lib/bubble.js'
import { ValidateError } from '../src/lib/errors.js'
import { factorial, dot } from '../src/lib/utils.js'
import { generateUnitCubeMesh } from '../src/lib/generator.js'

// Multi-tet mesh: exercises projection across shared faces/edges and
// verifies commuting properties hold element-by-element.
describe('Multi-tet Projector Projections', () => {
  const twoTet = {
    vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 1]],
    tetrahedra: [[0, 1, 2, 3], [1, 2, 3, 4]]
  }

  let mesh
  let whitney
  let traceProjector

  before(() => {
    mesh = new Mesh(twoTet.vertices, twoTet.tetrahedra)
    whitney = new Whitney(mesh)
    traceProjector = new Projector(mesh, whitney, { quadratureOrder: 3 })
    traceProjector.computeBoundaryWeights()
    traceProjector.buildLocator()
  })

  it('projectH1 is exact for constant on multi-tet mesh', () => {
    const u = () => 5
    for (let tIdx = 0; tIdx < mesh.tetrahedronCount; tIdx++) {
      const pt = mesh.getTetrahedronBarycenter(tIdx)
      const result = traceProjector.projectH1(u, pt, tIdx)
      expect(result).to.be.closeTo(5, Math.pow(10, -6))
    }
  })

  it('projectL2 integrates constants exactly on multi-tet mesh', () => {
    const u = () => 7
    for (let tIdx = 0; tIdx < mesh.tetrahedronCount; tIdx++) {
      const result = traceProjector.projectL2(u, tIdx)
      expect(result).to.be.closeTo(7, Math.pow(10, -6))
    }
  })

  it('projectAtPoint finds correct tet in multi-tet mesh', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const result = traceProjector.projectAtPoint(u, [0.1, 0.1, 0.1], 0)
    expect(result.tIdx).to.equal(0)
    expect(Number.isFinite(result.value)).to.equal(true)
  })

  it('projectHdiv returns finite vector on multi-tet mesh', () => {
    const v = (pt) => [2 * pt[0], 2 * pt[1], 2 * pt[2]]
    for (let tIdx = 0; tIdx < mesh.tetrahedronCount; tIdx++) {
      const pt = mesh.getTetrahedronBarycenter(tIdx)
      const projV = traceProjector.projectHdiv(v, pt, tIdx)
      expect(Array.isArray(projV)).to.equal(true)
      expect(projV.length).to.equal(3)
      projV.forEach((c) => expect(Number.isFinite(c)).to.equal(true))
    }
  })

  // Tolerance 1e-1: numerical divergence via finite differences (h=1e-5)
  // on the projected field introduces O(h) discretization error; 1e-1
  // accommodates the compounded error from projection + finite difference.
  it('commutes div Pi^2 = Pi^3 div on multi-tet mesh', () => {
    const v = (pt) => [2 * pt[0], 2 * pt[1], 2 * pt[2]]
    const divV = () => 6
    const h = 1e-5
    for (let tIdx = 0; tIdx < mesh.tetrahedronCount; tIdx++) {
      const pt = mesh.getTetrahedronBarycenter(tIdx)
      const proj = traceProjector.projectHdiv(v, pt, tIdx)
      const projVx = traceProjector.projectHdiv(v, [pt[0] + h, pt[1], pt[2]], tIdx)
      const projVy = traceProjector.projectHdiv(v, [pt[0], pt[1] + h, pt[2]], tIdx)
      const projVz = traceProjector.projectHdiv(v, [pt[0], pt[1], pt[2] + h], tIdx)
      const numDiv =
        (projVx[0] - proj[0]) / h +
        (projVy[1] - proj[1]) / h +
        (projVz[2] - proj[2]) / h
      const l2Div = traceProjector.projectL2(divV, tIdx)
      expect(numDiv).to.be.closeTo(l2Div, Math.pow(10, -1))
    }
  })

  it('Pi^1 reproduces gradient of linear function on multi-tet mesh', () => {
    const u = (pt) => 2 * pt[0] - 3 * pt[1] + 5 * pt[2]
    const gradU = [2, -3, 5]
    for (let tIdx = 0; tIdx < mesh.tetrahedronCount; tIdx++) {
      const pt = mesh.getTetrahedronBarycenter(tIdx)
      const proj = traceProjector.projectHcurl(u, pt, tIdx)
      expect(proj[0]).to.be.closeTo(gradU[0], Math.pow(10, -5))
      expect(proj[1]).to.be.closeTo(gradU[1], Math.pow(10, -5))
      expect(proj[2]).to.be.closeTo(gradU[2], Math.pow(10, -5))
    }
  })

  it('Pi^2 has a continuous normal trace across the shared interior face', () => {
    const sharedIdx = mesh.faces.findIndex((_, fIdx) => mesh.faceToTets[fIdx].length === 2)
    expect(sharedIdx).to.be.greaterThan(-1)
    const n = mesh.getFaceOutwardNormal(sharedIdx)
    const fv = mesh.faces[sharedIdx].map((v) => mesh.vertices[v])
    const centroid = [
      (fv[0][0] + fv[1][0] + fv[2][0]) / 3,
      (fv[0][1] + fv[1][1] + fv[2][1]) / 3,
      (fv[0][2] + fv[1][2] + fv[2][2]) / 3
    ]
    const points = [centroid]
    for (const pair of [[0, 1], [0, 2], [1, 2]]) {
      points.push([
        (fv[pair[0]][0] + fv[pair[1]][0]) / 2,
        (fv[pair[0]][1] + fv[pair[1]][1]) / 2,
        (fv[pair[0]][2] + fv[pair[1]][2]) / 2
      ])
    }
    const v = (pt) => [1, 0, 0]
    const [t0, t1] = mesh.faceToTets[sharedIdx]
    for (const pt of points) {
      const pi0 = traceProjector.projectHdiv(v, pt, t0)
      const pi1 = traceProjector.projectHdiv(v, pt, t1)
      const c0 = dot(pi0, n)
      const c1 = dot(pi1, n)
      expect(Number.isFinite(c0)).to.equal(true)
      // Interior-face coefficients must use the same mesh-orientation normal
      // on both adjacent tets so the discrete normal trace is continuous.
      expect(c0).to.be.closeTo(c1, Math.pow(10, -10))
    }
  })
})

// Verifies that Mesh throws ValidateError for various invalid inputs.
describe('Mesh Validation', () => {
  it('throws ValidateError for negative orientation', () => {
    expect(() => new Mesh(
      [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 2, 1, 3]] // inverted: 0,2,1 instead of 0,1,2
    )).to.throw(ValidateError)
  })

  it('throws ValidateError for out-of-bounds index', () => {
    expect(() => new Mesh(
      [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 1, 2, 4]]
    )).to.throw(ValidateError)
  })

  it('throws ValidateError for duplicate vertices in tet', () => {
    expect(() => new Mesh(
      [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 1, 1, 3]]
    )).to.throw(ValidateError)
  })

  it('throws ValidateError for non-finite vertex', () => {
    expect(() => new Mesh(
      [[0, 0, NaN], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 1, 2, 3]]
    )).to.throw(ValidateError)
  })

  it('throws ValidateError for non-integer tetrahedron index', () => {
    expect(() => new Mesh(
      [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 1, 2, 3.5]]
    )).to.throw(ValidateError)
  })

  it('throws ValidateError for empty tetrahedra', () => {
    expect(() => new Mesh([[0, 0, 0]], [])).to.throw(ValidateError)
  })

  it('rejects degenerate (zero-volume) tetrahedra', () => {
    expect(() => new Mesh(
      [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]],
      [[0, 1, 2, 3]]
    )).to.throw(ValidateError)
  })
})

// Tests edge cases in the higher-order projection framework: p=1 fallback
// to lowest-order, p=2,3 L2 enrichment for H^1, and unimplemented l=1,2 p>0.
describe('Higher-Order Edge Cases', () => {
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
  })

  it('p=1 H1 returns exact base projection', () => {
    const u = (pt) => pt[0] * pt[0] + pt[1] * pt[1]
    const pt = mesh.getTetrahedronBarycenter(0)
    const p0 = traceProjector.projectHp(u, pt, 0, 0, 0)
    const p1 = traceProjector.projectHp(u, pt, 0, 0, 1)
    expect(p1).to.equal(p0)
  })

  it('p=2,3 H1 uses L2 enrichment', () => {
    const u = (pt) => pt[0] * pt[0] + pt[1] * pt[1]
    const pt = mesh.getTetrahedronBarycenter(0)
    const p0 = traceProjector.projectHp(u, pt, 0, 0, 0)
    const p2 = traceProjector.projectHp(u, pt, 0, 0, 2)
    const p3 = traceProjector.projectHp(u, pt, 0, 0, 3)
    expect(typeof p2).to.equal('number')
    expect(Number.isFinite(p2)).to.equal(true)
    expect(typeof p3).to.equal('number')
    expect(Number.isFinite(p3)).to.equal(true)
    // Higher-order should differ from lowest-order for non-linear functions.
    expect(p2).to.not.equal(p0)
    expect(p3).to.not.equal(p0)
  })

  it('throws for unimplemented l=1, p>0', () => {
    const u = (pt) => [pt[0], pt[1], pt[2]]
    const pt = mesh.getTetrahedronBarycenter(0)
    expect(() => traceProjector.projectHp(u, pt, 0, 1, 1)).to.throw(/not yet implemented/)
  })

  it('throws for unimplemented l=2, p>0', () => {
    const u = (pt) => [pt[0], pt[1], pt[2]]
    const pt = mesh.getTetrahedronBarycenter(0)
    expect(() => traceProjector.projectHp(u, pt, 0, 2, 1)).to.throw(/not yet implemented/)
  })
})

// Verifies ProjectError is thrown for invalid arguments to projection methods.
describe('Projection Error Handling', () => {
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

  it('throws for invalid tIdx type', () => {
    expect(() => traceProjector.projectH1(() => 1, [0, 0, 0], '0')).to.throw()
  })

  it('throws for out-of-range tIdx', () => {
    expect(() => traceProjector.projectH1(() => 1, [0, 0, 0], 5)).to.throw()
  })

  it('throws for negative tIdx', () => {
    expect(() => traceProjector.projectH1(() => 1, [0, 0, 0], -1)).to.throw()
  })

  it('throws for invalid point type', () => {
    expect(() => traceProjector.projectH1(() => 1, 'bad', 0)).to.throw(/point must be/)
  })

  it('throws for NaN in point', () => {
    expect(() => traceProjector.projectH1(() => 1, [0, NaN, 0], 0)).to.throw(/point must be/)
  })
})

// Tests the Bubble bubble solve path, including singular
// matrix fault injection via sinon stubs.
describe('Bubble Projection', () => {
  afterEach(() => sinon.restore())

  const singleTet = {
    vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
    tetrahedra: [[0, 1, 2, 3]]
  }

  let mesh
  let whitney

  before(() => {
    mesh = new Mesh(singleTet.vertices, singleTet.tetrahedra)
    whitney = new Whitney(mesh)
  })

  it('solveBubbleProjection returns null for p < 4', () => {
    const hop = new Bubble(mesh, whitney)
    const result = hop.solveBubbleProjection(0, 3, () => 1)
    expect(result).to.equal(null)
  })

  it('factorial overflow throws for n > 170', () => {
    expect(() => factorial(171)).to.throw(/overflows/)
  })

  it('solveBubbleProjection computes coefficients for p = 4', () => {
    const hop = new Bubble(mesh, whitney)
    const coeffs = hop.solveBubbleProjection(0, 4, (pt) => pt[0] * pt[0])
    expect(coeffs).to.not.equal(null)
    expect(coeffs.length).to.be.above(0)
  })

  it('evaluateBubble returns 0 when coeffs are empty', () => {
    const hop = new Bubble(mesh, whitney)
    const val = hop.evaluateBubble(0, 4, [], [0.1, 0.1, 0.1])
    expect(val).to.equal(0)
  })

  it('evaluateBubble evaluates a bubble correction', () => {
    const hop = new Bubble(mesh, whitney)
    const coeffs = hop.solveBubbleProjection(0, 4, (pt) => pt[0] * pt[0])
    const pt = [0.1, 0.1, 0.1]
    const val = hop.evaluateBubble(0, 4, coeffs, pt)
    expect(Number.isFinite(val)).to.equal(true)
  })

  it('evaluateL2Projection returns 0 for empty coeffs', () => {
    const hop = new Bubble(mesh, whitney)
    const val = hop.evaluateL2Projection([], [0.25, 0.25, 0.25, 0.25], 1)
    expect(val).to.equal(0)
  })

  it('solveL2Projection returns empty array for negative p', () => {
    const hop = new Bubble(mesh, whitney)
    const coeffs = hop.solveL2Projection(0, -1, () => 1)
    expect(coeffs).to.deep.equal([])
  })

  it('solveBubbleProjection warns on singular mass matrix', () => {
    const warnSpy = sinon.spy()
    const mesh = new Mesh(
      [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 1, 2, 3]]
    )
    const whitney = new Whitney(mesh)
    const hop = new Bubble(mesh, whitney, 3, warnSpy)
    // Inject a singular mass matrix to force the solver to fail.
    hop.assembleBubbleMass = () => [[0]]
    const coeffs = hop.solveBubbleProjection(0, 4, () => 1)
    expect(coeffs).to.equal(null)
    expect(warnSpy.called).to.equal(true)
  })

  it('solveL2Projection warns on singular mass matrix', () => {
    const warnSpy = sinon.spy()
    const mesh = new Mesh(
      [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[0, 1, 2, 3]]
    )
    const whitney = new Whitney(mesh)
    const hop = new Bubble(mesh, whitney, 3, warnSpy)
    // Force zero volume to make the mass matrix singular.
    const origGetVolume = mesh.getVolume.bind(mesh)
    mesh.getVolume = () => 0
    const coeffs = hop.solveL2Projection(0, 2, () => 1)
    // The failed solve falls back to the cell mean (constant polynomial),
    // never to a silent zero.
    expect(coeffs.length).to.be.above(0)
    for (const c of coeffs) {
      expect(c).to.be.closeTo(1, Math.pow(10, -10))
    }
    expect(warnSpy.called).to.equal(true)
    mesh.getVolume = origGetVolume
  })
})

// Tests that H(curl) and H(div) projectors accept scalar functions
// (which are internally promoted to vector fields via numerical gradient).
describe('Scalar inputs to vector projections', () => {
  const cubeMesh = generateUnitCubeMesh(2)
  let whitney
  let traceProjector

  before(() => {
    whitney = new Whitney(cubeMesh)
    traceProjector = new Projector(cubeMesh, whitney, { quadratureOrder: 3 })
    traceProjector.computeBoundaryWeights()
  })

  it('projectHcurl accepts scalar function on multi-tet mesh', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const pt = [0.5, 0.5, 0.5]
    const result = traceProjector.projectAtPoint(u, pt, 1)
    expect(Array.isArray(result.value)).to.equal(true)
    expect(result.value.length).to.equal(3)
    result.value.forEach((v) => expect(Number.isFinite(v)).to.equal(true))
  })

  it('projectHdiv accepts scalar function on multi-tet mesh', () => {
    const u = (pt) => pt[0] + pt[1] + pt[2]
    const pt = [0.5, 0.5, 0.5]
    const result = traceProjector.projectAtPoint(u, pt, 2)
    expect(Array.isArray(result.value)).to.equal(true)
    expect(result.value.length).to.equal(3)
    result.value.forEach((v) => expect(Number.isFinite(v)).to.equal(true))
  })
})

// Verifies that Mesh rejects degenerate (coplanar/collinear) tetrahedra.
describe('Whitney degenerate tet handling', () => {
  it('rejects degenerate tet at mesh construction', () => {
    expect(() => new Mesh(
      [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]],
      [[0, 1, 2, 3]]
    )).to.throw(ValidateError)
  })
})
