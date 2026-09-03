# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] — 2026-09-03

The first release under the **traceprojector** name on Node 26. Adds
the new `web/` playground, drops Babel, and finishes the file-layout
rebrand.

### Added

- **New `web/` workspace.** A Next.js 16 + shadcn/ui playground that
  consumes the lib via npm workspaces, with a 3D tetrahedral-mesh
  viewer (three.js / @react-three/fiber), an API playground with
  copy-to-clipboard code export, and a live convergence plot
  (Recharts). Start it with `npm run web:dev`; build it with
  `npm run web:build`. A new `web` job in `.github/workflows/ci.yml`
  builds the playground on every push.
- **New "Try it online" entry** in the root `README.md` that points
  at the bundled web playground, alongside a convexfolio-style
  *What is this? / Who is this for? / What can it do? / Before you
  start / Installation / Your first run / Configuration / Where to
  go next* skeleton. The original technical depth (API, math,
  architecture, performance, tech stack) is kept as a second half.
- **`Projector.verifyBoundaryWeights`** (Section 6.3 cross-check): the
  exact boundary DoFs stay `u(v)`, `∫_e u·t`, `∫_f u·n` for any
  input, and each wired §6.3 weight functional is applied to its
  boundary simplex's canonical discrete trace basis field (P¹ hat
  `λ_v`, Whitney 1-form `W_e`, face `RT_0`) to confirm it recovers
  the normalized DoF — see `traceprojector/boundaryVerify.js` and
  `tests/weight.test.js`.
- **`Weight` vertex-weight assembly fix after an Alfeld/Worsey-Farin
  split:** the mesh appends barycenter vertices, so `bweight.vertexWeight`
  now receives a compact, remapped local vertex set for each boundary
  star. The previous full-vertex pass produced a singular stiffness
  matrix after the split and silently skipped every vertex weight.
- **Edge boundary weight `ζ_{0,e}^1`** (Section 6.3.2) on the
  lowest-order surface `N_0` (Whitney 1-form) space: build the
  star's edge indexing, assemble the Whitney mass matrix, solve for
  `η_e^1 = M^{-1}d` from the intrinsic edge moments
  `d_k = ∫_e W_k·t_e`, and expose the duality functional
  `(ζ, u) = (η_e^1, u)` reproducing the edge degree of freedom for
  H(curl) traces in `N_0` (eq. 6.31).
- **Face boundary weight `ζ_{0,f}^2`** (Section 6.3.3) on the
  lowest-order surface `RT_0` (Raviart-Thomas) space: assemble the
  RT_0 mass matrix over the extended star, solve for
  `η_f^2 = M^{-1}d` from the featured-face normal moments
  `d_k = ∫_f RT_k·n`, and expose the duality functional
  `(ζ, u) = (η_f^2, u)` reproducing the face degree of freedom for
  H(div) traces in `RT_0` (eq. 6.36).
- **Section 2.3 surface differential operators** (`grad_Γ`, `curl_Γ`,
  `div_Γ`, `rot_Γ`) and the Section 6.3 barycenter tent `μ` on
  Alfeld-split faces, in the new `traceprojector/surface.js` module.
- **Section 6.3 boundary-weight cascade** wired into `Weight.compute()`:
  `vertexBoundaryWeights`, `edgeBoundaryWeights`, and
  `faceBoundaryWeights` (built from `bweight.vertexWeight` /
  `edgeWeight` / `faceWeight` over each boundary vertex's star,
  edge's star, and face's extended star), stored on `Projector` via
  `computeBoundaryWeights`.
- **README sections:** *Tech stack*, *Security*, *Code of Conduct*,
  centered header with aligned badges, and license copyright.
- **`engines.node: ">=26.0.0"`** in `package.json` and a
  `workspaces: ["web"]` field. New convenience scripts `web:dev`,
  `web:build`, and `web:start` proxy into the workspace.
- **`.gitignore` entries** for the web workspace: `.next/`, `out/`,
  `next-env.d.ts`, `.turbo/`.

### Changed

- **README is rewritten** in the convexfolio skeleton (with the
  technical depth kept as a second half) and the GitHub URL is
  updated to `sachncs/traceprojector` in every badge.
- **CONTRIBUTING and SECURITY** are updated to use the public class
  name `Projector` and the package name `traceprojector` (no more
  `TraceProjector` or `Bcdtpp`).
- **Docs** (`docs/architecture.md`, `docs/development.md`,
  `docs/exceptions.md`, `docs/math.md`, `docs/setup.md`,
  `docs/testing.md`) are updated to reflect the new source path, the
  new error class names, the new requirement of Node 26, the new
  test files, and the new `web/` workflow.
- **`docs/api.md` is regenerated** via `npm run docs` to include
  the `bweight` and `surface` exports and the Section 6.3
  boundary-weight cascade.
- **Bump dev-dependency group to current latest:**
  - `@rollup/plugin-node-resolve` `^16.0.1` → `^16.0.3`
  - `jsdoc-to-markdown` `^9.1.1` → `^9.1.3`
  - `mocha` `^11.8.0` → `^12.0.0`
  - The rest of the dev deps (`@rollup/plugin-commonjs`,
    `@rollup/plugin-terser`, `rollup`, `c8`, `chai`, `sinon`,
    `standard`) were already at latest.
- **Bump GitHub Actions:** `actions/checkout` and
  `actions/setup-node` to `v8`.
- **Tighten the StandardJS `ignore` list** to also skip `web/` (the
  playground is type-checked with `tsc` and linted with `next lint`
  rather than StandardJS).
- **Section 6.3 tent `μ` fix** (line 1559 / eq. 6.21): `μ` is `1` at
  each face barycenter and `0` on every face boundary (edges /
  vertices), piecewise affine on the Alfeld-split sub-triangles —
  the globally-continuous paper definition — instead of the
  reverse vertex-valued tent.
- **Use the paper's `μ_σ = χ_{es_∂(σ)} μ`** (barycenter tent on the
  boundary-extended star) in the vertex boundary weight
  `ζ_{0,v}^0`, replacing the vertex tent; the dual property
  `(ζ, v^0, u) = u(v)` (eq. 6.25) is preserved.
- **Enforce the mean-zero constraint in `Solver` with an exact
  Lagrange-multiplier (bordered) solve** instead of row replacement,
  so every stiffness row is honored.
- **Use a single mesh-orientation normal flux for all H(div) faces
  with Whitney-basis sign alignment**, giving a continuous normal
  trace across interior faces.
- **Fall back to the cell mean** (never a silent zero) when a
  higher-order L² mass matrix solve is singular.
- **Evaluate the H¹ boundary DoF exactly at the vertex `u(v)`** (eq.
  6.25) instead of approximating the weighted surface integral.
- **Use the exact edge DoF `∫_e u·t ds` on every H(curl) edge,**
  interior included, instead of midpoint tangential sampling.
- **Source files renamed to single-word names:** `math_utils` →
  `utils`, `local_solver` → `solver`, `boundary_weight_computer` →
  `weight`, `higher_order_projection` → `bubble`, `mesh_refinement`
  → `refinement`, `mesh_generator` → `generator`, `point_locator` →
  `locator`, `convergence_harness` → `harness`,
  `projectors/*_projector` → `projectors/h1|hcurl|hdiv|l2`.
- **Classes renamed to single words:** `TraceProjector` →
  `Projector`, `H1Projector` → `H1`, `HcurlProjector` → `Hcurl`,
  `HdivProjector` → `Hdiv`, `L2Projector` → `L2`,
  `BoundaryWeightComputer` → `Weight`, `LocalSolver` → `Solver`,
  `HigherOrderProjection` → `Bubble`, `MeshRefinement` →
  `Refinement`, `PointLocator` → `Locator`, `MeshValidationError` →
  `ValidateError`, `ProjectionError` → `ProjectError`,
  `SingularMatrixError` → `SingularError`.
- **Plain public member names for every field and method**; no
  `#private` markers and no leading-underscore semi-private
  prefixes.
- **Package export subpaths renamed** (`./utils`, `./locator`) and
  the `PointLocator` / `buildPointLocator` API to `Locator` /
  `buildLocator`.
- **Fix case-sensitivity bug in tests** importing
  `traceProjector.js` (now `traceprojector.js`).
- **Restructure README header** with centered layout and aligned
  badges.
- **Rename package from `bcdtpp` to `traceprojector`** (the public
  class was `Bcdtpp` at the time, later renamed to `TraceProjector`,
  and finally to `Projector`).
- **Remove the obsolete `Weight.computeVertexWeights` Solver /
  `nodeMap` route** and the now-dead `vertexBoundaryData` /
  `Projector.vertexData` (the H¹ boundary DoF is exact `u(v)`).
  Drop the unused `meshRefinement` constructor argument from
  `Weight`, and drop the now-dead `Weight fault isolation` coverage
  tests.

### Changed (BREAKING)

- **Source tree moved from `src/lib/` to `traceprojector/`.** The
  `src/` wrapper is gone — the package now ships with the source
  living in a top-level `traceprojector/` directory, so the package
  name and the directory name match exactly and the layout is
  obvious from the repo root. `package.json` (`main`, `module`,
  `unpkg`, `jsdelivr`, every `exports.*`, `types`, `files`), the
  `docs` script glob, the rollup `input`, the `architecture.md`
  module map, the `math.md` cross-references, the
  `setup.md` / `testing.md` / `development.md` examples, the
  README, and every `tests/*.test.js` import are updated. The
  internal layout of the package is preserved, so relative imports
  inside the package still resolve.
- **Babel is removed from the build pipeline.** `@babel/core`,
  `@babel/preset-env`, `@rollup/plugin-babel`, and
  `babel.config.json` are deleted: the project is pure ESM and only
  ever runs on Node 26+, so the Babel pass was a no-op.
- **Pin to Node 26.** The CI matrix is reduced from `[20, 22]` to a
  single Node 26 job, and the `publish.yml` workflow is updated
  accordingly. `docs/setup.md` requirements are bumped to Node 26,
  npm 11. A new `web` CI job compiles the Next.js playground.
- **Repository URL** is updated to
  `https://github.com/sachncs/traceprojector` in `package.json`
  (`homepage`, `repository.url`, `bugs.url`), every README badge,
  the CI workflow URLs (implicit), and the `docs/setup.md`
  install instructions. The historical commit links in the
  changelog still point at the original
  `bounded-commuting-discrete-trace-preserving-projections` repo
  because they reference real past commits.
- **Error class names in docs:** `MeshValidationError` →
  `ValidateError`, `ProjectionError` → `ProjectError`,
  `SingularMatrixError` → `SingularError` (the class names in
  source were already renamed earlier in this release; this just
  brings the docs in line).

## [0.0.7](https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections/commit/e9b643c) — 2026-06-20

- Add comprehensive test suite: interior projector, convergence harness, local solver, mesh generator, point locator, Whitney basis, quadrature, coverage edge cases
- Add convergence test framework (h-refinement and p-refinement on all four form degrees)
- Add mesh generator for cube subdivision
- Add PointLocator AABB tree for O(log N) point-in-tet queries
- Add LocalSolver with surface stiffness assembly and constrained solve
- Add BoundaryWeightComputer for trace-preserving projection weights
- Implement Worsey-Farin split (§6.1.4) with idempotency
- Implement Alfeld split (§6.1.3) with idempotency
- Fix UMD global name to TraceProjector in rollup config
- Fix linting issues across all source files

## [0.0.6](https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections/commit/403d048) — 2026-05-12

- Add Mesh class with topology (faces, edges, boundary), geometry (volume, normals), and adjacency
- Add Whitney class for barycentric coordinates and Whitney finite-element basis functions
- Add math utilities: LU solver, 3x3 inverse, numerical gradient, vector operations
- Add higher-order projection framework (§7) with bubble corrections
- Add L2 projector (l=3) for piecewise constants
- Add MeshRefinement class for Alfeld/Worsey-Farin splits
- Fix orientation sign computation for edges and faces
- Fix tetDeterminant (scalar triple product) and add tetVolume
- Refactor projectors into separate files under `src/lib/projectors/`

## [0.0.5](https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections/commit/8daf318) — 2026-05-12

- Add H(curl) projector (l=1) for Nédélec first-kind (Whitney 1-form) space
- Add H(div) projector (l=2) for Raviart-Thomas (Whitney 2-form) space
- Implement interior projector Π_ring^l and discrete extension operator E^l
- Implement boundary correction part Π_partial^l
- Implement global projector decomposition: Π^l = Π_partial^l + Π_ring^l (I − Π_partial^l)
- Add computeBoundaryWeights for trace-preserving projections

## [0.0.4](https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections/commit/399c333) — 2026-05-05

- Add H1 projector (l=0) for continuous piecewise-linear space
- Implement boundary-aware projection with vertex weights
- Add projectAtPoint convenience method with AABB point locator
- Add extractBoundaryDofs for boundary degree-of-freedom extraction

## [0.0.3](https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections/commit/593e4d2) — 2026-05-05

- Add TraceProjector main class with project method dispatching to form degree l
- Add basic error classes: MeshValidationError, ProjectionError, SingularMatrixError
- Implement first version of H1 projection
- Add rollup UMD bundle configuration

## [0.0.2](https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections/commit/cc2313d) — 2026-05-04

- Add Mesh class with tetrahedral mesh construction and validation
- Add Whitney class with barycentric coordinates and edge/face basis functions
- Add math utilities: dot, cross, norm, subtract, matrix operations
- Add Gaussian quadrature for triangles, tetrahedra, and lines
- Add Mocha/Chai test infrastructure

## [0.0.1](https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections/commit/197b86b) — 2026-05-03

- Initial project setup with npm, StandardJS, Mocha/Chai, c8 coverage
- Add README, CONTRIBUTING, LICENSE, and project configuration
- Add GitHub Actions CI workflow
- Add documentation: architecture, math background, setup, testing, publishing

---

## Dependency Updates

### 2026-07-07

- Merge pull request #1 — Bump actions/checkout from 4 to 7
- Merge pull request #2 — Bump actions/setup-node from 4 to 6
- Merge pull request #3 — Bump dev-dependencies group (4 updates)
- Merge pull request #4 — Bump chai from 5.3.3 to 6.2.2
- Merge pull request #5 — Bump c8 from 10.1.3 to 11.0.0
- Merge pull request #6 — Bump @babel/preset-env from 7.29.5 to 8.0.2
- Merge pull request #7 — Bump @babel/core from 7.29.0 to 8.0.1
