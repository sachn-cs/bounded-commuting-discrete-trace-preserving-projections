/**
 * Integration tests for the Section 6.3 boundary-weight cascade exposed by
 * Weight.compute(): the edge and face duality functionals built from
 * bweight.edgeWeight / bweight.faceWeight over the mesh boundary stars.
 *
 * The reproduction identities themselves (eqs. 6.25 / 6.31 / 6.36) are verified
 * in tests/bweight.test.js; these tests confirm the cascade is wired into the
 * Weight.compute() surface for a closed mesh.
 */
import { expect } from 'chai'
import { Mesh } from '../src/lib/mesh.js'
import { Whitney } from '../src/lib/whitney.js'
import { Projector } from '../src/lib/traceprojector.js'
import { Weight } from '../src/lib/weight.js'
import { generateUnitCubeMesh } from '../src/lib/generator.js'

// Closed boundary of a single tetrahedron: 4 vertices, 6 edges, 4 faces.
const vertices = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
]
const tetrahedra = [[0, 1, 2, 3]]

describe('Weight Section 6.3 boundary-weight cascade', () => {
  let result

  before(() => {
    const mesh = new Mesh(vertices, tetrahedra)
    const weight = new Weight(mesh, () => {})
    result = weight.compute()
  })

  it('exposes a vertex duality functional per boundary vertex', () => {
    expect(result.vertexBoundaryWeights.size).to.equal(4)
    for (const [, vw] of result.vertexBoundaryWeights) {
      expect(typeof vw.pair).to.equal('function')
      expect(typeof vw.integral).to.equal('number')
      expect(Array.isArray(vw.psi)).to.equal(true)
    }
  })

  it('exposes an edge duality functional per boundary edge', () => {
    expect(result.edgeBoundaryWeights.size).to.equal(6)
    for (const [, ew] of result.edgeBoundaryWeights) {
      expect(ew.ePair).to.have.length(2)
      expect(typeof ew.pair).to.equal('function')
      expect(ew.eta).to.be.an('array')
    }
  })

  it('exposes a face duality functional per boundary face', () => {
    expect(result.faceBoundaryWeights.size).to.equal(4)
    for (const [, fw] of result.faceBoundaryWeights) {
      expect(fw.face).to.have.length(3)
      expect(typeof fw.pair).to.equal('function')
      expect(fw.nBasis).to.be.a('number')
    }
  })

  it('edge weights return finite pairings for a constant tangential field', () => {
    const u = (pt) => [1, 0, 0]
    for (const [, ew] of result.edgeBoundaryWeights) {
      const val = ew.pair(u)
      expect(Number.isFinite(val)).to.equal(true)
    }
  })

  it('face weights return finite pairings for a constant tangential field', () => {
    const u = (pt) => [1, 0, 0]
    for (const [, fw] of result.faceBoundaryWeights) {
      const val = fw.pair(u)
      expect(Number.isFinite(val)).to.equal(true)
    }
  })
})

describe('Projector.verifyBoundaryWeights (Section 6.3 cross-check)', () => {
  // Closed boundary of a single tetrahedron: 4 vertices, 6 edges, 4 faces.
  const vertices = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]
  const tetrahedra = [[0, 1, 2, 3]]

  it('reproduces every boundary DoF on the single-tetrahedron surface', () => {
    const mesh = new Mesh(vertices, tetrahedra)
    const projector = new Projector(mesh, new Whitney(mesh))
    projector.computeBoundaryWeights()
    const res = projector.verifyBoundaryWeights()
    expect(res.ok).to.equal(true)
    expect(res.failing).to.equal(0)
    // 4 vertices + 6 edges + 4 faces * 3 RT basis fields.
    expect(res.passed).to.equal(4 + 6 + 4 * 3)
  })

  it('computes all vertex weights even after the Alfeld/Worsey-Farin split', () => {
    const mesh = new Mesh(vertices, tetrahedra)
    const projector = new Projector(mesh, new Whitney(mesh))
    projector.computeBoundaryWeights()
    expect(projector.vertexBoundaryWeights.size).to.equal(4)
    const res = projector.verifyBoundaryWeights()
    expect(res.ok).to.equal(true)
  })

  it('reproduces every boundary DoF on a multi-tetrahedron cube surface', () => {
    const mesh = generateUnitCubeMesh(1)
    const projector = new Projector(mesh, new Whitney(mesh))
    projector.computeBoundaryWeights()
    const res = projector.verifyBoundaryWeights()
    expect(res.ok).to.equal(true)
    expect(res.failing).to.equal(0)
    expect(res.passed).to.equal(
      mesh.getBoundaryNodes().size +
        mesh.getBoundaryEdges().length +
        mesh.getBoundaryFaces().length * 3
    )
  })

  it('reports failure when computeBoundaryWeights() was not called', () => {
    const mesh = new Mesh(vertices, tetrahedra)
    const projector = new Projector(mesh, new Whitney(mesh))
    const res = projector.verifyBoundaryWeights()
    expect(res.ok).to.equal(false)
    expect(res.checks).to.have.length(0)
  })
})
