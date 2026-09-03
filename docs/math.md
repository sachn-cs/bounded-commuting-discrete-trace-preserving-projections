# Mathematical Background

This document provides a concise mathematical introduction to the operators implemented in this library.

## The 3D de Rham Complex

On a contractible domain, the de Rham complex is the exact sequence:

```
H^1  --grad-->  H(curl)  --curl-->  H(div)  --div-->  L^2  -->  0
```

For a bounded Lipschitz domain, the complex is:

```
H^1_0  --grad-->  H_0(curl)  --curl-->  H_0(div)  --div-->  L^2_0  -->  0
```

## Discrete Spaces

On a simplicial mesh, the lowest-order finite-element spaces that form a discrete de Rham complex are:

- **P^1_0 (H^1)**: continuous piecewise-linear Lagrange elements (vertex DoFs).
- **N^0_1 (H(curl))**: Nédélec edge elements (edge DoFs).
- **RT^0_1 (H(div))**: Raviart-Thomas face elements (face DoFs).
- **P^0_3 (L^2)**: piecewise constants (cell DoFs).

## Projection Operators

The library implements bounded, commuting, discrete-trace preserving projections `Pi^l` for `l = 0,1,2,3`.

### Decomposition

Each projection is decomposed as:

```
Pi^l = Pi_partial^l + Pi_ring^l (I - Pi_partial^l)
```

Where:

- **Pi_partial^l**: Prescribes boundary data exactly and extends it into the interior.
- **Pi_ring^l**: The interior projector with vanishing trace on the boundary.

### Trace Preservation

The operators satisfy:

```
tr^l(Pi^l v) = tr^l(v)    on boundary faces/edges/vertices
```

Where `tr^l` is the canonical trace operator for the `l`-form space.

### Boundary Weight Cascade (Section 6.3)

The lowest-order trace-preserving boundary weights are constructed sequentially
over the surface (`bweight` module):

```
zeta_{0,v}^0  ->  zeta_{0,e}^1  ->  zeta_{0,f}^2
```

Each weight lives in/acts on a staggered boundary trace space and is exposed as
an L2-duality functional that reproduces the canonical degree of freedom:

- `zeta_{0,v}^0` (Section 6.3.1): on `P_1`, reproduces `phi_v(u) = u(v)` (eq. 6.25).
- `zeta_{0,e}^1` (Section 6.3.2): on `N_0` (surface Whitney 1-forms), reproduces
  `phi_e(u) = int_e u . t_e` (eq. 6.31).
- `zeta_{0,f}^2` (Section 6.3.3): on `RT_0` (surface Raviart-Thomas), reproduces
  `phi_f(u) = int_f u . n` (eq. 6.36).

All weights use the Section 6.3 tent `mu_sigma = chi_{es_d(sigma)} * mu` (eq.
6.21), where `mu` is the globally-continuous barycenter tent that is `1` at each
face barycenter and `0` on every face boundary. The L2-dual representative is
`eta = M^{-1} d`, with `d` the intrinsic DoF moment vector and `M` the mass
matrix of the boundary trace space on the (possibly extended) star.

The projectors keep the exact boundary DoFs (`u(v)`, `int_e u . t_e`,
`int_f u . n_f`) for arbitrary inputs, and the weights above are wired in as a
checked cross-check: `Projector.verifyBoundaryWeights()` applies each weight
functional to its boundary simplex's canonical discrete trace basis field and
verifies it recovers the normalized DoF (see `src/lib/boundaryVerify.js`).

The supporting surface differential operators (`grad_Gamma`, `rot_Gamma`,
`curl_Gamma`, `div_Gamma`, eqs. 2.10/2.14a/2.14b) and the tent `mu` are provided
by the `surface` module.

### Commuting Diagram

The projections commute with the exterior derivative:

```
d^l Pi^l = Pi^{l+1} d^l
```

In concrete terms:
- `grad Pi^0 = Pi^1 grad`
- `curl Pi^1 = Pi^2 curl`
- `div Pi^2 = Pi^3 div`

## Whitney Forms

Barycentric coordinates `lambda_i` form the basis for `P^1_0`. Their gradients are constant per tetrahedron.

The Whitney edge basis for `N^0_1` is:

```
phi_{ij} = lambda_i grad(lambda_j) - lambda_j grad(lambda_i)
```

The Whitney face basis for `RT^0_1` is:

```
psi_{ijk} = 2 (lambda_i grad(lambda_j) x grad(lambda_k) + cyclic)
```

## Mesh Refinement

Boundary weights require solving local problems on subdivided patches:

- **Alfeld split**: A tetrahedron is split into 4 sub-tetrahedra by connecting the barycenter to each face.
- **Worsey-Farin split**: A tetrahedron is split into 12 sub-tetrahedra by connecting face barycenters to the tet barycenter.

These splits are used to construct stable local solvers for the boundary correction operators.

## Higher-Order Extensions

For polynomial degree `p > 0`:

- **H^1 (l=0)**: Enriched with bubble functions that vanish on the element boundary.
- **L^2 (l=3)**: Enriched with monomials of total degree up to `p`.

Vector-valued higher-order (`l = 1, 2`, `p > 0`) is not yet implemented.
