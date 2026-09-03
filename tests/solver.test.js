/**
 * Tests for the Solver static methods: surface stiffness assembly
 * (symmetry, degenerate-triangle rejection) and constrained solve
 * (ill-conditioning warning, singularity detection, edge cases).
 */
import { expect } from 'chai'
import sinon from 'sinon'
import { Solver } from '../traceprojector/solver.js'
import { SingularError } from '../traceprojector/errors.js'

// Tests for Solver: surface stiffness symmetry, ill-conditioning
// detection, singular matrix rejection, and degenerate triangle handling.
describe('Solver', () => {
  afterEach(() => sinon.restore())

  // Tolerance 1e-10: compares K[i][j] to K[j][i] for floating-point
  // symmetry; 1e-10 accounts for round-off from double-precision arithmetic.
  it('assembleSurfaceStiffness returns symmetric matrix', () => {
    const vertices = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]]
    const triangles = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]
    const K = Solver.assembleSurfaceStiffness(vertices, triangles)
    const n = K.length
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        expect(K[i][j]).to.be.closeTo(K[j][i], Math.pow(10, -10))
      }
    }
  })

  it('solveWithConstraint warns for ill-conditioned matrix', () => {
    const warnSpy = sinon.spy()
    // Construct an ill-conditioned matrix by scaling one row/column very large.
    const K = [
      [1e14, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
    const b = [0, 0, 0]
    Solver.solveWithConstraint(K, b, warnSpy)
    expect(warnSpy.called).to.equal(true)
    expect(warnSpy.getCall(0).args[0].code).to.equal('LOCAL_SOLVER_ILL_CONDITIONED')
    expect(warnSpy.getCall(0).args[0].message).to.match(/ill-conditioned/)
  })

  it('solveWithConstraint throws SingularError for singular matrix', () => {
    const K = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ]
    const b = [0, 0, 0]
    expect(() => Solver.solveWithConstraint(K, b)).to.throw(SingularError)
  })

  it('solveWithConstraint honors all stiffness rows and the mean-zero constraint', () => {
    // Closed tetrahedron surface: --Delta_Gamma has constants in its kernel,
    // so the result must both satisfy K x = b (consistent RHS) and sum(x) = 0.
    // A row-replacement solver would silently drop the last stiffness row;
    // the bordered solve must not.
    const vertices = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]]
    const triangles = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]
    const K = Solver.assembleSurfaceStiffness(vertices, triangles)
    const b = [3, -1, -1, -1]
    const x = Solver.solveWithConstraint(K, b)
    expect(x.length).to.equal(4)
    const sumX = x.reduce((s, v) => s + v, 0)
    expect(sumX).to.be.closeTo(0, Math.pow(10, -9))
    const Kx = [0, 0, 0, 0]
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        Kx[i] += K[i][j] * x[j]
      }
    }
    for (let i = 0; i < 4; i++) {
      expect(Kx[i]).to.be.closeTo(b[i], Math.pow(10, -9))
    }
  })

  it('assembleSurfaceStiffness throws for degenerate triangle', () => {
    const vertices = [[0, 0, 0], [1, 0, 0], [2, 0, 0]]
    const triangles = [[0, 1, 2]]
    expect(() => Solver.assembleSurfaceStiffness(vertices, triangles)).to.throw(
      SingularError
    )
  })

  it('solveWithConstraint returns empty array for n=0', () => {
    const result = Solver.solveWithConstraint([], [])
    expect(result).to.deep.equal([])
  })
})
