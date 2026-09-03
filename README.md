<p align="center">
  <h1 align="center">traceprojector</h1>
  <p align="center">Bounded, Commuting, Discrete-trace Preserving Projections for the 3D de Rham complex on simplicial meshes.</p>
  <p align="center">
    <a href="#installation"><img src="https://img.shields.io/badge/node-%E2%89%A526.0.0-43853d" alt="Node 26+"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
    <a href="https://github.com/sachncs/traceprojector/releases/latest"><img src="https://img.shields.io/github/v/release/sachncs/traceprojector" alt="Latest release"></a>
    <a href="https://github.com/sachncs/traceprojector/actions"><img src="https://img.shields.io/github/actions/workflow/status/sachncs/traceprojector/ci.yml?branch=master" alt="CI"></a>
    <a href="https://www.npmjs.com/package/traceprojector"><img src="https://img.shields.io/npm/v/traceprojector" alt="npm"></a>
    <a href="https://github.com/sachncs/traceprojector/stargazers"><img src="https://img.shields.io/github/stars/sachncs/traceprojector" alt="Stars"></a>
    <a href="https://standardjs.com/"><img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" alt="StandardJS"></a>
    <a href="https://github.com/bcoe/c8"><img src="https://img.shields.io/badge/coverage-c8-yellow" alt="c8"></a>
  </p>
  <p align="center">
    <a href="https://github.com/sachncs/traceprojector/blob/master/CHANGELOG.md"><img src="https://img.shields.io/badge/changelog-0.1.0-blue" alt="Changelog"></a>
  </p>
</p>

---

## What is this?

**traceprojector** is a pure-JavaScript implementation of the
**Bounded, Commuting, Discrete-trace Preserving Projections** `Π^l`
for the discrete 3D de Rham complex. It builds, for `l = 0, 1, 2, 3`,
the projection operators that

> 1. are **bounded** in the natural `H^1`, `H(curl)`, `H(div)`, `L^2`
>    norms,
> 2. **commute** with the exterior derivative `d^l` (`grad Π^0 =
>    Π^1 grad`, `curl Π^1 = Π^2 curl`, `div Π^2 = Π^3 div`),
> 3. **preserve discrete traces** on the boundary: vertex values,
>    edge tangential integrals, and face normal fluxes are reproduced
>    exactly.

It implements the construction from

> *Ern, Guzmán, Potu (2026) — [arXiv:2604.28103v1](https://arxiv.org/abs/2604.28103).*

> **Disclaimer:** I am not an author of the paper above. This
> repository is an independent JavaScript implementation of the
> algorithm described in that work.

---

## What's new in 0.1.0

- **Node 26 only.** Dropped Babel, dropped Node 20/22 from the
  matrix, bumped every dev dep to current latest.
- **New file layout.** The package now ships from a top-level
  `traceprojector/` directory — no more `src/lib/` wrapper.
- **New `web/` playground.** A Next.js 16 + shadcn/ui app that
  consumes the lib via npm workspaces. 3D mesh viewer, API
  playground with code export, convergence plot. See
  [Option 2 below](#option-2--try-it-online-no-install).
- **Rebrand complete.** Repository, badges, docs, error class
  names — everything is `sachncs/traceprojector` and `Projector`.
  See the [0.1.0 changelog entry](CHANGELOG.md#010--2026-09-03) for
  the full list.

---

## Who is this for?

You, even if:

- You've never worked with finite elements before.
- You don't know what the **de Rham complex** is — the
  [Glossary](docs/math.md) explains every term in plain English.
- You're a numerical-analysis researcher looking for a small,
  dependency-free reference implementation of `Π^l`.
- You teach an FEM course and want a live playground for your
  students — the bundled [web playground](web/) has 3D mesh
  visualisation, a convergence plot, and a code exporter.

If you can install Node 26 and type commands into a terminal, you can
use traceprojector.

---

## What can it do?

- **Full 3D de Rham complex (lowest order)** — `Π^0` (vertex-based,
  `H^1`), `Π^1` (edge-based, `H(curl)`), `Π^2` (face-based,
  `H(div)`), `Π^3` (cell-based, `L^2`).
- **Exact boundary DoFs** — the projector keeps `u(v)` at every
  boundary vertex, `∫_e u·t ds` at every boundary edge, and
  `∫_f u·n dA` at every boundary face, for arbitrary input `u`.
- **Section 6.3 boundary-weight cascade** — vertex, edge, and face
  duality functionals on the surface trace spaces
  `P^1`, `N_0` (Whitney 1-form), `RT_0` (Raviart-Thomas), built from
  the barycenter tent `μ` and the local mass matrix on each star.
- **Mesh refinement** — Alfeld split (§6.1.3) for boundary faces and
  Worsey-Farin split (§6.1.4) for bulk tets. Both are idempotent.
- **Higher-order projection** — scalar bubble basis for `H^1` with
  `p ≥ 4` and an L² monomial basis for `L^2` with `p ≥ 1`. (Vector-
  valued higher-order on `H(curl)` / `H(div)` is not yet
  implemented.)
- **AABB point location** — `O(log N)` point-in-tet queries after
  one-time tree build.
- **Zero runtime dependencies** — the entire linear-algebra kernel
  (LU solve, `3×3` inverse, barycentric gradients, surface operators)
  is hand-rolled in pure JavaScript.

---

## Before you start

You'll need **Node.js 26 or newer** installed on your computer.

1. Open a terminal (on macOS: `Cmd + Space`, type "Terminal"; on
   Windows: open "PowerShell"; on Linux: open your usual terminal).
2. Type `node --version` and press Enter.
3. If you see a version number starting with `26`, you're set.
4. If you see "command not found" or an older version, install Node
   26 via [fnm](https://github.com/Schniz/fnm),
   [nvm](https://github.com/nvm-sh/nvm), or the
   [official installer](https://nodejs.org/).

You'll also need **git**. Same drill: `git --version`.

---

## Installation

### Option 1 — From npm (easiest)

```bash
npm install traceprojector
```

### Option 2 — Try it online (no install)

The bundled [web playground](web/) is a Next.js 16 app that loads the
library straight from this repo. Once you have the repo cloned (see
Option 3), you can run it with:

```bash
npm run web:dev          # open http://localhost:3000
```

It gives you a 3D mesh viewer, an API playground with code export, and
a live convergence plot.

### Option 3 — From source (recommended for development)

A workspace keeps the lib and the playground in one tree.

```bash
# 1. Download the code
git clone https://github.com/sachncs/traceprojector.git
cd traceprojector

# 2. Install the lib and the web playground in one shot
npm install

# 3. Build the ESM / CJS / UMD bundles into dist/
npm run build
```

> 💡 The `web/` directory is an npm workspace. When you `import
> { … } from 'traceprojector'` inside the playground, npm symlinks
> it back to `traceprojector/` so you never have to rebuild the
> lib to see your changes.

---

## Your first run — Node.js

Open a Node 26 REPL (`node` in your terminal) and try this:

```javascript
import { Mesh, Whitney, Projector, generateUnitCubeMesh } from 'traceprojector'

// Build a 4×4×4 unit-cube tetrahedral mesh.
const mesh = generateUnitCubeMesh(4)
const whitney = new Whitney(mesh)

// Build the projection operator. Pre-compute the boundary weights
// and the AABB tree once; reuse the same projector for every query.
const projector = new Projector(mesh, whitney, { quadratureOrder: 3 })
projector.computeBoundaryWeights()
projector.buildLocator()

// Project the function u(x, y, z) = sin(x) cos(y) e^z at a point.
const u = (p) => Math.sin(p[0]) * Math.cos(p[1]) * Math.exp(p[2])
const value = projector.projectH1(u, [0.5, 0.5, 0.5], 0)
console.log(value)
```

You'll see a number close to `sin(0.5) · cos(0.5) · e^0.5 ≈ 1.365`.

**Higher-order.** Ask for a degree-`p` scalar enrichment:

```javascript
projector.projectHp(u, [0.5, 0.5, 0.5], 0, /* l */ 0, /* p */ 2)
```

**Project at any point** (AABB point location handled internally):

```javascript
const { value, tIdx, bary } = projector.projectAtPoint(u, [0.1, 0.2, 0.3], 0)
// { value, tIdx, bary: [λ₀, λ₁, λ₂, λ₃] }
```

The full walk-through with explanations of every line lives in
[docs/math.md](docs/math.md).

---

## Your first run — the browser (UMD via CDN)

The UMD bundle is also available via jsDelivr / unpkg:

```html
<script src="https://cdn.jsdelivr.net/npm/traceprojector/dist/traceprojector.umd.js"></script>
<script>
  const { Mesh, Whitney, Projector } = window.TraceProjector
</script>
```

---

## Configuration

Pass an options object as the third argument to `new Projector(mesh, whitney, options)`:

| Option | Default | Plain English |
|---|---|---|
| `quadratureOrder` | `3` | Gaussian quadrature order for the local stiffness solves. Higher = more accurate, slower. |
| `boundarySplit` | `"alfeld"` | Either `"alfeld"` (face split) or `"worsey-farin"` (bulk-tet split). |
| `onWarning` | `console.warn` | Callback for `BWC_*` / `HOP_*` warnings (singular mass, zero star area, …). |
| `aabbLeafSize` | `8` | Maximum tetrahedra per AABB leaf node. Larger = fewer nodes, slower queries. |

---

## Where to go next

For users:

- **[API reference](docs/api.md)** — Auto-generated from JSDoc. The
  full list of classes, methods, and exports. Bookmark this once you
  start writing real code.
- **[Mathematical background](docs/math.md)** — The 3D de Rham
  complex, Whitney forms, the Section 6.3 boundary-weight cascade,
  and mesh-refinement theory.
- **[Architecture](docs/architecture.md)** — How the package is put
  together, for the curious.
- **[Error taxonomy](docs/exceptions.md)** — Every `ValidateError` /
  `ProjectError` / `SingularError` and every `BWC_*` / `HOP_*`
  warning code.

For operators / maintainers:

- **[Setup](docs/setup.md)** — Installing and using the lib in your
  own project.
- **[Testing](docs/testing.md)** — How tests are organised and how
  to write new ones.
- **[Development](docs/development.md)** — `npm run …` reference.
- **[Publishing](docs/publishing.md)** — Versioning and release
  process.

---

## API at a glance

| Symbol | Type | Description |
|---|---|---|
| `Projector` | class | Main projection orchestrator (`Π^0..3`). |
| `Mesh` | class | Tetrahedral mesh topology & geometry. |
| `Whitney` | class | Barycentric coordinates & Whitney basis. |
| `Locator` | class | AABB tree point-in-tet locator. |
| `Refinement` | class | Alfeld / Worsey-Farin mesh splits. |
| `Weight` | class | Section 6.3 boundary-weight cascade. |
| `Bubble` | class | Higher-order scalar / L² enrichment. |
| `Solver` | class | Surface-patch stiffness + constrained solves. |
| `Surface` | class | `grad_Γ`, `curl_Γ`, `div_Γ`, `rot_Γ`, barycenter tent `μ`. |
| `H1` / `Hcurl` / `Hdiv` / `L2` | classes | Per-form-degree projectors. |
| `projectH1` / `projectHcurl` / `projectHdiv` / `projectL2` | methods | Lowest-order projections. |
| `projectHp` | method | Higher-order scalar projection (`p ≥ 1`). |
| `projectAtPoint` | method | Project at any point (point location handled internally). |
| `computeBoundaryWeights` | method | Pre-compute the trace-preserving boundary weights. |
| `buildLocator` | method | Build the AABB tree for `projectAtPoint`. |
| `verifyBoundaryWeights` | method | Cross-check each boundary weight against its canonical DoF. |
| `generateUnitCubeMesh` | function | Structured unit-cube tetrahedral mesh (dev/test). |
| `quadrature` | module | Gaussian quadrature utilities. |
| `utils` | module | Linear-algebra primitives (LU, `3×3` inverse, …). |

All subpaths are exposed via the `exports` field in `package.json` and
include hand-written `.d.ts` files in `traceprojector/`.

---

## Mathematical background

The library implements boundary correction operators `Π_∂^l`. The
final projection is:

```
Π^l = Π_∂^l + Π_ring^l (I − Π_∂^l)
```

- `Π_∂^l` prescribes boundary data exactly and extends it into the
  interior.
- `Π_ring^l` is the interior projector with vanishing trace on the
  boundary.
- The novel contribution of the paper is the construction of `Π_∂^l`
  using local problems on subdivided patches (Alfeld or
  Worsey-Farin) to ensure stability and trace preservation.

The lowest-order trace-preserving boundary weights are constructed
sequentially over the surface (`Weight` module):

```
ζ_{0,v}^0  →  ζ_{0,e}^1  →  ζ_{0,f}^2
```

Each weight lives in a staggered boundary trace space and is exposed
as an L²-duality functional that reproduces the canonical degree of
freedom (see [docs/math.md](docs/math.md) for the full exposition).

---

## Project structure

```
traceprojector/                — Library source (pure ESM, no runtime deps)
  traceprojector.js           — Projector class (main API)
  mesh.js, whitney.js, quadrature.js
  utils.js, solver.js, locator.js, refinement.js
  bweight.js, weight.js, surface.js, boundaryVerify.js
  bubble.js, generator.js, harness.js, errors.js
  projectors/
    h1.js, hcurl.js, hdiv.js, l2.js

tests/                         — Mocha + Chai test suites

docs/                          — User & maintainer documentation
  api.md (auto-generated)
  math.md, architecture.md, exceptions.md
  setup.md, testing.md, development.md, publishing.md

web/                           — Next.js 16 + shadcn playground
  (3D mesh viewer, API playground, convergence plot, code export)

dist/                          — Rollup bundles: ESM, CJS, UMD
```

---

## Performance

- **Mesh construction** — `O(V + T)` where `V` is the vertex count
  and `T` the tet count.
- **Point location** — `O(log T)` per query after one-time AABB
  tree build.
- **Boundary weight computation** — `O(V · k)` where `k` is the
  typical boundary-patch size; this is the dominant upfront cost.
- **Per-element projection** — `O(1)` for lowest order; `O(p³)` for
  higher-order scalar enrichment.

---

## Tech stack

| Category | Technology |
|---|---|
| Language | JavaScript (ES2024, pure ESM) |
| Runtime | Node.js ≥ 26 |
| Build | [Rollup](https://rollupjs.org/) (ESM + CJS + UMD) |
| Lint | [StandardJS](https://standardjs.com/) |
| Testing | [Mocha](https://mochajs.org/) + [Chai](https://www.chaijs.com/) |
| Coverage | [c8](https://github.com/bcoe/c8) |
| Docs | [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown) |
| Playground | [Next.js 16](https://nextjs.org/) + [shadcn/ui](https://ui.shadcn.com/) + [three.js](https://threejs.org/) |
| CI | [GitHub Actions](https://github.com/features/actions) |

---

## Roadmap

### High priority

- **Vector-valued higher-order projections** (`l = 1, 2`, `p > 0`) —
  Nédélec and Raviart-Thomas enrichment for `H(curl)` and `H(div)`.
- **Adaptive mesh refinement support** — integrate `Refinement` APIs
  into `Projector` so boundary weights can be recomputed
  incrementally as the mesh refines.

### Medium priority

- **Web Worker parallelization** — offload per-tet projection and
  boundary weight solves to workers for large meshes.
- **WASM acceleration** — port the dense linear-algebra routines
  (`luSolve`, `inverse3x3`) to WebAssembly for a 2-5× speedup.

### Low priority / Research

- **Anisotropic mesh support** — generalize the point locator and
  quadrature to handle highly stretched tets without loss of
  precision.
- **Time-dependent projections** — cache-friendly APIs for projecting
  fields that evolve between time steps.
- **Arbitrary polynomial degree `p`** — unify the scalar bubble and
  L² monomial bases into a single hierarchical basis generator.

---

## Contributing

Want to improve traceprojector? See [CONTRIBUTING.md](CONTRIBUTING.md)
for how to set up a development environment and submit changes.

## Code of Conduct

We expect everyone to follow our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Found a security issue? See [SECURITY.md](SECURITY.md) — please don't
open a public GitHub issue for security problems.

## License

[MIT](LICENSE) © 2026 Sachin
