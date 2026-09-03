# Architecture

## Module Map

```
src/traceprojector/
  traceprojector.js     — Main API: Projector class
  mesh.js               — Tetrahedral mesh topology, geometry, adjacency
  whitney.js            — Barycentric coords, Whitney edge/face basis
  quadrature.js         — Gaussian quadrature on triangles, tetrahedra, lines
  utils.js              — Linear algebra: LU, inverse, vector ops
  solver.js             — Boundary-patch stiffness + constrained solve
  locator.js            — AABB tree for O(log N) point location
  bubble.js             — Bubble basis assembly, L2 monomial projection
  bweight.js            — Alfeld/Worsey-Farin split + weight solves
  weight.js             — Boundary weight computer (vertex/edge/face cascade)
  refinement.js         — Alfeld and Worsey-Farin mesh splits
  surface.js            — Surface differential operators + barycenter tent
  boundaryVerify.js     — Section 6.3 weight cross-check
  harness.js            — Convergence experiment utilities (dev/test)
  generator.js          — Structured cube mesh generator (dev/test)
  errors.js             — Custom error classes
  projectors/
    h1.js               — Pi^0 (vertex-based)
    hcurl.js            — Pi^1 (edge-based)
    hdiv.js             — Pi^2 (face-based)
    l2.js               — Pi^3 (cell-based)
```

## Data Flow

```
User Input
    |
    v
Mesh (vertices, tets)
    |
    +---> Whitney (barycentric coords, basis)
    |         |
    |         v
    |     Projector (API facade)
    |         |
    |         +---> Weight
    |         |         +---> Refinement (Alfeld / Worsey-Farin)
    |         |         +---> Solver
    |         |         +---> Bweight (per-star weight solve)
    |         |         +---> BoundaryVerify (cross-check)
    |         |
    |         +---> Locator (AABB tree)
    |         |
    |         +---> Bubble (bubble / L2 enrichment)
    |         |
    |         +---> Projectors (H1, Hcurl, Hdiv, L2)
    |                   +---> utils (LU, vector ops)
    |                   +---> Surface (grad_Gamma, curl_Gamma, div_Gamma)
    |
    +---> Quadrature (integrals)
```

## Projector Hierarchy

Each projector implements the same interface:

```
project(u, point, tIdx, boundaryFaceSet) -> value
```

- `H1`: Vertex DoFs + boundary-weighted vertex values.
- `Hcurl`: Edge DoFs + line-integral constraints on boundary edges.
- `Hdiv`: Face DoFs + normal-flux constraints on boundary faces.
- `L2`: Cell average via quadrature.

## Key Design Decisions

1. **Pure ES modules**: No CommonJS in source; bundlers handle multi-format output.
2. **Zero external runtime dependencies**: All linear algebra is native JavaScript.
3. **Immutable mesh inputs**: `Mesh` validates and freezes topology at construction.
4. **Lazy caching**: `Whitney` caches per-tet barycentric gradients; `Projector` caches boundary weights on demand.
5. **Warning instead of throwing for local failures**: `Weight` and `Bubble` warn on singular matrices so that a single bad element does not crash the entire mesh projection.
6. **Section 6.3 boundary-weight cascade**: `Weight` wires three duality functionals (vertex, edge, face) on the surface trace spaces via `bweight`; `boundaryVerify` cross-checks each functional against the canonical DoF.
7. **Surface differential operators**: `Surface` exposes `grad_Γ`, `curl_Γ`, `div_Γ`, `rot_Γ` plus the barycenter tent `μ` required by the Section 6.3 cascade.
