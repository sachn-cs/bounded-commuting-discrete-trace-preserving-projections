## Classes

<dl>
<dt><a href="#Bubble">Bubble</a></dt>
<dd><p>Higher-order projection framework implementing Section 7 of the paper.</p>
<p>For polynomial degree p &gt;= 4 on H^1 (l=0), the projection Pi^l_p is built
from the lowest-order projection by adding bubble corrections on
Alfeld-split patches.  For L2 (l=3) with p &gt;= 1, a Bernstein-basis
L2 projection is used instead.</p>
<p>For p = 1, 2, 3 on H^1 the bubble space is empty (the product
b = lambda_0 * lambda_1 * lambda_2 * lambda_3 already has degree 4),
so projectHp returns the lowest-order projection without enrichment.</p>
</dd>
<dt><a href="#ValidateError">ValidateError</a></dt>
<dd><p>Thrown when mesh input data fails validation.</p>
</dd>
<dt><a href="#ProjectError">ProjectError</a></dt>
<dd><p>Thrown when a projection cannot be computed.</p>
</dd>
<dt><a href="#SingularError">SingularError</a></dt>
<dd><p>Thrown when a linear system is singular or numerically ill-conditioned.</p>
</dd>
<dt><a href="#Locator">Locator</a></dt>
<dd><p>Axis-aligned bounding box (AABB) tree for O(log N) point-in-tetrahedron
queries.</p>
<p>The tree is built by recursively splitting tetrahedra along the longest
axis at the median centroid, guaranteeing a balanced tree.  Leaf nodes
store up to maxLeafSize tetrahedra and are tested exhaustively.</p>
</dd>
<dt><a href="#Mesh">Mesh</a></dt>
<dd><p>Tetrahedral mesh data structure with topological connectivity and boundary
extraction.  This class is intentionally a <em>pure data structure</em>; mesh
refinement operators (Alfeld split, Worsey-Farin split) live in
<a href="#Refinement">Refinement</a>.</p>
</dd>
<dt><a href="#Refinement">Refinement</a></dt>
<dd><p>Mesh refinement operators implementing Alfeld face splitting (Section 6.1.3)
and Worsey-Farin tetrahedron splitting (Section 6.1.4).</p>
<p>This class mutates the underlying Mesh by appending barycenter vertices.
It stores the refinement data (sub-triangles, sub-tetrahedra) separately so
that Mesh remains a pure data structure.</p>
<p>Both splits are idempotent: calling them more than once is a no-op.</p>
</dd>
<dt><a href="#Solver">Solver</a></dt>
<dd><p>Static utility for assembling surface-patch stiffness matrices and solving
constrained linear systems during boundary weight computation.</p>
<p>Constraints are enforced exactly with a Lagrange-multiplier (bordered)
system, so every stiffness row is preserved and the recovered solution
satisfies the original equations up to the constraint multiplier.</p>
</dd>
<dt><a href="#Projector">Projector</a></dt>
<dd><p>TRACEPROJECTOR: Bounded, Commuting, Discrete-trace Preserving Projections.</p>
<p>Implements the de Rham projection operators Pi^l for l = 0,1,2,3 on
tetrahedral meshes with boundary-aware trace preservation.</p>
<p><strong>Coupling note:</strong> This class accesses mesh data through the <a href="#Mesh">Mesh</a>
public API (getters for vertices, faces, edges, boundary flags, orientation
signs, etc.).  Swapping in a different mesh implementation requires only that
the new class implements the same getter interface.</p>
</dd>
<dt><a href="#Weight">Weight</a></dt>
<dd><p>Computes boundary patch weights used by the trace-preserving projection
operators.  For each boundary vertex, it assembles a surface-patch stiffness
matrix on the Alfeld-split star, solves a constrained Laplace problem to
obtain the weight functions psi, and collects edge tangents and face normals.</p>
<p>Local failures (e.g. degenerate patches) emit warnings rather than throwing
so that a single bad element does not halt the entire mesh projection.</p>
</dd>
<dt><a href="#Whitney">Whitney</a></dt>
<dd><p>Barycentric coordinate computation and Whitney finite-element basis
functions on a tetrahedral mesh.</p>
<p>Provides the Whitney 1-forms (Nedelec edge basis) and 2-forms
(Raviart-Thomas face basis) used by the H(curl) and H(div) projectors.
All per-tet geometry (edge matrix, inverse, gradients) is cached at
construction time for efficient repeated evaluation.</p>
</dd>
<dt><a href="#H1">H1</a></dt>
<dd><p>Lowest-order H1 (l=0) vertex-based projector implementing Pi^0.</p>
<p>Projects scalar functions onto the space of continuous piecewise-linear
functions (P1 Lagrange) on a tetrahedral mesh.  Boundary vertices use
weighted surface-patch integrals (computed by <a href="#Weight">Weight</a>)
to ensure trace preservation.  Interior vertices use nodal interpolation.</p>
</dd>
<dt><a href="#Hcurl">Hcurl</a></dt>
<dd><p>Lowest-order H(curl) (l=1) edge-based projector implementing Pi^1.</p>
<p>Projects vector functions onto the Nédélec first-kind (Whitney 1-form)
space.  Boundary edges use exact tangential-trace degrees of freedom
(∫_e u·t ds); interior edges use midpoint evaluation of the tangential
component.</p>
</dd>
<dt><a href="#Hdiv">Hdiv</a></dt>
<dd><p>Lowest-order H(div) (l=2) face-based projector implementing Pi^2.</p>
<p>Projects vector functions onto the Raviart-Thomas (Whitney 2-form) space.
Every face uses the same exact normal-flux degree of freedom
(∫_f u·n dA) with the mesh-orientation normal, so interior faces share a
consistent coefficient with both adjacent tetrahedra and the discrete
normal trace is continuous across the mesh.</p>
</dd>
<dt><a href="#L2">L2</a></dt>
<dd><p>Lowest-order L2 (l=3) cell-based projector implementing Pi^3.</p>
<p>Projects scalar functions onto the space of piecewise constants (P0)
on a tetrahedral mesh.  The projection is simply the volume-weighted
average of the function over each tetrahedron.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#EPSILON">EPSILON</a> : <code>number</code></dt>
<dd></dd>
<dt><a href="#Maximum">Maximum</a> : <code>number</code></dt>
<dd><p>n for which n! fits in a JavaScript Number without overflowing.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#solveConstrained">solveConstrained(K, b, k)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Solves the bordered system for a kernel Lagrange-multiplier constraint:
    K x + alg * k = b,  (k, x) = 0.</p>
</dd>
<dt><a href="#faceRec">faceRec(tv, face)</a> ⇒ <code>Object</code></dt>
<dd><p>Per-face P1 assembly record.</p>
</dd>
<dt><a href="#gradP1">gradP1(tv, coeff)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Gradient of the P1 function with nodal values coeff on triangle tv.</p>
</dd>
<dt><a href="#baryOnTriangle">baryOnTriangle(pt, tv)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Barycentric coordinates of a point in a triangle (area ratios).</p>
</dd>
<dt><a href="#faceInt">faceInt(fr, f, order)</a> ⇒ <code>number</code></dt>
<dd><p>Integrates scalar f over a face using barycentric quadrature.</p>
</dd>
<dt><a href="#vertexWeight">vertexWeight(verts, faces, vIdx)</a> ⇒ <code>Object</code></dt>
<dd><p>Vertex boundary weight zeta_{0,v}^0 (Section 6.3.1).</p>
<p>Solves (6.22) for psi_v^0 in the mean-zero complement of P1 on the boundary
star of v:
    (mu_v grad psi, grad u)_star = phi_v^partial(u) - (eta_v^0, u)<em>star
where eta_v^0 := 1/|es_partial(v)| (constant on the star) and mu_v :=
chi</em>{es_d(v)} mu is the Section 6.3 barycenter tent mu (eq. 6.21) restricted
to the vertex star: 1 at each star-face barycenter, 0 on the star boundary.</p>
<p>The weight is exposed as the duality functional (Lemma 6.2)
    (zeta_{0,v}^0, u)_Gamma = (eta,u) + (mu_v grad psi, grad u)
which reproduces phi_v^partial(u) = u(v) for P1 u.</p>
</dd>
<dt><a href="#integrateScalar">integrateScalar(frs, f, q)</a> ⇒ <code>number</code></dt>
<dd><p>Integrates a scalar over all faces.</p>
</dd>
<dt><a href="#areaIntegralScalar">areaIntegralScalar(frs, f, q)</a> ⇒ <code>number</code></dt>
<dd><p>Area-weighted integral of a scalar over all faces.</p>
</dd>
<dt><a href="#integrateScalar1">integrateScalar1(fr, f, q)</a> ⇒ <code>number</code></dt>
<dd><p>Integrates over a single face (area-weighted).</p>
</dd>
<dt><a href="#lamOf">lamOf(pt, tv, a)</a> ⇒ <code>number</code></dt>
<dd><p>Local (face) barycentric coordinate value of a point for node index a.</p>
</dd>
<dt><a href="#buildN0Space">buildN0Space(verts, faces)</a> ⇒ <code>Object</code></dt>
<dd><p>Builds the surface N_0 (Whitney 1-form) trace space over a collection of
boundary faces: a global edge indexing (with a fixed orientation) plus, for
each face, the mapping of its three local edges to global ids and the sign
aligning each local Whitney basis to the global edge orientation.</p>
</dd>
<dt><a href="#whitney1">whitney1(pt, tv, grads, i, j)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Surface Whitney 1-form W_{ij} = lam_i grad lam_j - lam_j grad lam_i at a
point in the tangent plane of a face.</p>
</dd>
<dt><a href="#scaleVec">scaleVec(v, s)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Scales a vector by s.</p>
</dd>
<dt><a href="#edgeWeight">edgeWeight(verts, faces, ePair)</a> ⇒ <code>Object</code></dt>
<dd><p>Edge boundary weight zeta_{0,e}^1 (Section 6.3.2), lowest-order N_0.</p>
<p>On the extended star of edge e the edge DoF vector</p>
<pre><code>d_k := int_e W_k . t_e ds
</code></pre>
<p>is assembled by 1D Gauss quadrature over the featured edge, and the L2-dual
representative eta_e^1 solves the Whitney mass system</p>
<pre><code>M eta_e^1 = d.
</code></pre>
<p>The weight is exposed as the duality functional</p>
<pre><code>(zeta_{0,e}^1, u)_Gamma = (eta_e^1, u) = sum_k eta_k (W_k, u)
</code></pre>
<p>which is integrable for a general input 1-form u and reproduces the edge
degree of freedom for u whose H(curl) trace lies in N_0 (eq. 6.31):</p>
<pre><code>(zeta_{0,e}^1, tr^1 u)_Gamma = int_e u . t_e.
</code></pre>
<p>(Given this eta_e^1 the Section 6.3.2 right-hand side (6.28) vanishes on the
N_0 trace space, so the modal psi_e^1 term (mu_e curl psi, curl u) drops out
and the L2-dual alone reproduces (6.31).)</p>
</dd>
<dt><a href="#rt0Basis">rt0Basis(fr)</a> ⇒ <code>Array.&lt;function(Array.&lt;number&gt;): !Array.&lt;number&gt;&gt;</code></dt>
<dd><p>Lowest-order surface Raviart-Thomas (RT_0) basis on a single face.</p>
<p>The three basis functions are affine tangential vector fields, one per edge,
with a constant normal trace of unit flux on their own edge and vanishing
normal flux on the other two (the standard 2D RT_0): for edge e with
opposite vertex p_o, RT_e(x) = (|e| / (2 A)) (x - p_o), projected into the
face&#39;s tangent plane.</p>
</dd>
<dt><a href="#faceWeight">faceWeight(verts, faces, fFace)</a> ⇒ <code>Object</code></dt>
<dd><p>Face boundary weight zeta_{0,f}^2 (Section 6.3.3), lowest-order RT_0.</p>
<p>On the extended star of the featured face, assembles the lowest-order surface
Raviart-Thomas trace basis, its mass matrix, and the face-DoF vector</p>
<pre><code>d_k := int_f RT_k . n dA   (normal moment over the featured face),
</code></pre>
<p>then forms eta_f^2 = M^{-1} d and exposes the duality functional</p>
<pre><code>(zeta_{0,f}^2, u)_Gamma = (eta_f^2, u) = sum_k eta_k (RT_k, u)
</code></pre>
<p>reproducing the face degree of freedom for H(div) traces in RT_0 (eq. 6.36):</p>
<pre><code>(zeta_{0,f}^2, tr^2 u)_Gamma = int_f u . n.
</code></pre>
</dd>
<dt><a href="#generateUnitCubeMesh">generateUnitCubeMesh(n)</a> ⇒ <code><a href="#Mesh">Mesh</a></code></dt>
<dd><p>Generates a uniform tetrahedral mesh of the unit cube [0,1]^3 using the
Freudenthal (Kuhn) triangulation: each cube is split into 6 tets along
the body diagonal from (0,0,0) to (1,1,1).</p>
</dd>
<dt><a href="#generateSingleTetMesh">generateSingleTetMesh()</a> ⇒ <code><a href="#Mesh">Mesh</a></code></dt>
<dd><p>Generates a single reference tetrahedron mesh.</p>
</dd>
<dt><a href="#computeL2ErrorScalar">computeL2ErrorScalar(mesh, traceProjector, exactFn, projFn)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the L2 error between an exact function and its projection.</p>
<p>err_L2^2 = ΣT ∫_T |u_exact - u_proj|^2 dx</p>
</dd>
<dt><a href="#computeL2ErrorVector">computeL2ErrorVector(mesh, traceProjector, exactFn, projFn)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the L2 error for a vector-valued projection.</p>
<p>err_L2^2 = ΣT ∫_T |v_exact - v_proj|^2 dx</p>
</dd>
<dt><a href="#computeH1SemiError">computeH1SemiError(mesh, traceProjector, exactFn, projFn)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the H1 semi-norm error (L2 error of the gradient) for scalar projections.
Uses numerical differentiation of the exact function for comparison.</p>
<p>err_H1^2 = ΣT ∫_T |grad(u_exact) - grad(u_proj)|^2 dx</p>
</dd>
<dt><a href="#estimateMeshSize">estimateMeshSize(mesh)</a> ⇒ <code>number</code></dt>
<dd><p>Estimates the mesh size h as the cube root of the average tetrahedron volume
scaled to unit volume, or more simply the maximum edge length.</p>
</dd>
<dt><a href="#computeRate">computeRate(err1, err2, h1, h2)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the observed convergence rate between two successive error measurements.</p>
<p>rate = log(err_1 / err_2) / log(h_1 / h_2)</p>
</dd>
<dt><a href="#runConvergenceStudy">runConvergenceStudy(meshes, config)</a> ⇒ <code>Array.&lt;{h: number, l2Err: number, h1Err: (number|undefined), rateL2: (number|undefined), rateH1: (number|undefined)}&gt;</code></dt>
<dd><p>Runs a convergence study on a sequence of meshes.</p>
</dd>
<dt><a href="#sort3">sort3(a, b, c)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Sorts three numbers in ascending order.</p>
</dd>
<dt><a href="#triangleQuadrature">triangleQuadrature(order)</a> ⇒ <code>Object</code></dt>
<dd><p>Returns quadrature points and weights on the reference triangle.</p>
<p>Note: order 3 contains a negative weight (-9/16). Callers integrating
non-smooth or sign-changing functions should consider a lower order or
a different rule to avoid cancellation issues.</p>
</dd>
<dt><a href="#tetrahedronQuadrature">tetrahedronQuadrature(order)</a> ⇒ <code>Object</code></dt>
<dd><p>Returns quadrature points and weights on the reference tetrahedron.</p>
<p>Note: order 3 contains a negative weight (-4/5). Callers integrating
non-smooth or sign-changing functions should consider a lower order or
a different rule to avoid cancellation issues.</p>
</dd>
<dt><a href="#integrateTriangle">integrateTriangle(vertices, fn, [order])</a> ⇒ <code>number</code></dt>
<dd><p>Integrates a scalar function over a triangle using quadrature.</p>
</dd>
<dt><a href="#barycentricToCartesian">barycentricToCartesian(vertices, bary)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Maps barycentric coordinates to a Cartesian point.</p>
</dd>
<dt><a href="#lineQuadrature">lineQuadrature(order)</a> ⇒ <code>Object</code></dt>
<dd><p>Returns quadrature points and weights on the reference interval [0, 1].</p>
</dd>
<dt><a href="#compositeTetrahedronQuadrature">compositeTetrahedronQuadrature(order)</a> ⇒ <code>Object</code></dt>
<dd><p>Returns a composite quadrature rule by subdividing the reference tetrahedron
into 4 sub-tetrahedra via the centroid and applying the base rule on each.
This increases the number of quadrature points, ensuring the mass matrix
for polynomial spaces up to degree 3 remains full-rank.</p>
</dd>
<dt><a href="#integrateTetrahedron">integrateTetrahedron(vertices, fn, [order])</a> ⇒ <code>number</code></dt>
<dd><p>Integrates a scalar function over a tetrahedron using quadrature.</p>
</dd>
<dt><a href="#triangleFrame">triangleFrame(verts)</a> ⇒ <code>Object</code></dt>
<dd><p>Returns the unit outward normal and two orthonormal tangent directions of a
triangle, plus the oriented area-normal (cross product of two edges).</p>
</dd>
<dt><a href="#gradGamma">gradGamma(pt, verts, u, [h])</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Surface gradient of a scalar function at a point on a triangle.
Projects the ambient gradient onto the tangent plane.</p>
</dd>
<dt><a href="#rotGamma">rotGamma(pt, verts, u)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Surface rotated gradient: rot_Gamma(u) = n x grad_Gamma(u)  (eq. 2.10).</p>
</dd>
<dt><a href="#curlGamma">curlGamma(pt, verts, v, [h])</a> ⇒ <code>number</code></dt>
<dd><p>Surface scalar curl of a tangential vector field: the adjoint of rot_Gamma
under the L2 inner product (eq. 2.14a).</p>
<p>On a flat triangle with orthonormal tangent frame {t1, t2} the field
v = v1 t1 + v2 t2 has curl_Gamma(v) = dv2/dt1 - dv1/dt2 (a scalar).  Use the
weak/adjoint relation to evaluate it pointwise via first-order differences
in the tangent frame.</p>
</dd>
<dt><a href="#divGamma">divGamma(pt, verts, v, [h])</a> ⇒ <code>number</code></dt>
<dd><p>Surface divergence of a tangential vector field: -(adjoint of grad_Gamma)
under the L2 inner product (eq. 2.14b).</p>
</dd>
<dt><a href="#muTent">muTent(faceVerts, barycenter, pt)</a> ⇒ <code>number</code></dt>
<dd><p>Barycenter tent function mu on the Alfeld-split boundary mesh (Section 6.3,
eq. 6.21; line 1559).</p>
<p>Let mu be the globally continuous function on Gamma that is piecewise affine
on the Alfeld-split boundary mesh, vanishes on every face boundary (the
original boundary edges/vertices), and takes the value one at each face
barycenter.  On each boundary face the Alfeld split introduces the face
barycenter m and partitions the face into three sub-triangles {v_i, v_j, m};
on the sub-triangle {vi, vj, m} the tent is linear with values
(mu(vi), mu(vj), mu(m)) = (0, 0, 1), i.e. mu equals the barycentric
coordinate of m (the third sub-triangle vertex).</p>
<p>The per-simplex weights are</p>
<pre><code>mu_sigma := chi_{es_partial(sigma)} * mu
</code></pre>
<p>i.e. the barycenter tent restricted to the boundary extended star of sigma.</p>
</dd>
<dt><a href="#dot">dot(a, b)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the dot product of two 3D vectors.</p>
</dd>
<dt><a href="#tetDeterminant">tetDeterminant(v0, v1, v2, v3)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the determinant (scalar triple product) of the tetrahedron with
vertices v0, v1, v2, v3.  The absolute value divided by 6 equals the volume.</p>
</dd>
<dt><a href="#tetVolume">tetVolume(v0, v1, v2, v3)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the geometric volume of a tetrahedron.</p>
</dd>
<dt><a href="#cross">cross(a, b)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Computes the cross product of two 3D vectors.</p>
</dd>
<dt><a href="#subtract">subtract(a, b)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Subtracts vector b from vector a.</p>
</dd>
<dt><a href="#norm">norm(v)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the Euclidean norm of a vector.</p>
</dd>
<dt><a href="#subtractInto">subtractInto(a, b, out)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>In-place vector subtraction: out = a - b.</p>
</dd>
<dt><a href="#crossInto">crossInto(a, b, out)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>In-place cross product: out = a x b.</p>
</dd>
<dt><a href="#triangleArea">triangleArea(p1, p2, p3)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the area of a triangle given its three vertices.</p>
</dd>
<dt><a href="#zeros">zeros(rows, cols)</a> ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code></dt>
<dd><p>Creates a zero-initialized dense matrix.</p>
</dd>
<dt><a href="#infinityNorm">infinityNorm(a)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the infinity norm (maximum absolute row sum) of a matrix.</p>
</dd>
<dt><a href="#luSolve">luSolve(a, b)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Solves Ax = b using Gaussian elimination with partial pivoting and row
equilibration (pivot scaling).</p>
<p>The matrix is scaled so that each row has max-norm 1 before elimination,
reducing the risk of false singularity claims on poorly scaled systems.</p>
</dd>
<dt><a href="#inverse3x3">inverse3x3(m)</a> ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code></dt>
<dd><p>Computes the inverse of a 3x3 matrix.</p>
</dd>
<dt><a href="#solve3x3">solve3x3(a, b)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Solves a 3x3 linear system Ax = b using Cramer&#39;s rule.</p>
</dd>
<dt><a href="#factorial">factorial(n)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the factorial n!.</p>
</dd>
<dt><a href="#numericalGradient">numericalGradient(u, pt, [h])</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Numerical gradient of a scalar function using central differences.</p>
</dd>
</dl>

<a name="Solver"></a>

## Solver
Static utility for assembling surface-patch stiffness matrices and solving
constrained linear systems during boundary weight computation.

Constraints are enforced exactly with a Lagrange-multiplier (bordered)
system, so every stiffness row is preserved and the recovered solution
satisfies the original equations up to the constraint multiplier.

**Kind**: global class  

* [Solver](#Solver)
    * [.assembleSurfaceStiffness(vertices, triangles)](#Solver.assembleSurfaceStiffness) ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code>
    * [.solveWithConstraint(K, b, [onWarning])](#Solver.solveWithConstraint) ⇒ <code>Array.&lt;number&gt;</code>

<a name="Solver.assembleSurfaceStiffness"></a>

### Solver.assembleSurfaceStiffness(vertices, triangles) ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code>
Assembles the surface stiffness matrix for -Delta_Gamma.

**Kind**: static method of [<code>Solver</code>](#Solver)  

| Param | Type |
| --- | --- |
| vertices | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| triangles | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 

<a name="Solver.solveWithConstraint"></a>

### Solver.solveWithConstraint(K, b, [onWarning]) ⇒ <code>Array.&lt;number&gt;</code>
Solves K x = b with a mean-zero constraint sum(x) = 0.

The constraint is enforced exactly with a Lagrange multiplier lambda by
solving the symmetric bordered system

  [ K  1 ] [ x ]   [ b ]
  [ 1^T 0 ] [lambda] = [ 0 ]

and discarding the multiplier.  Unlike row replacement this keeps every
stiffness row intact and preserves symmetry, so x satisfies K x = b up to
a constant (lambda * 1) and is the true constrained solution.

**Kind**: static method of [<code>Solver</code>](#Solver)  

| Param | Type | Description |
| --- | --- | --- |
| K | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> |  |
| b | <code>Array.&lt;number&gt;</code> |  |
| [onWarning] | <code>function</code> | Callback invoked with a warning context   object when the matrix is ill-conditioned. |

<a name="EPSILON"></a>

## EPSILON : <code>number</code>
**Kind**: global constant  
<a name="Maximum"></a>

## Maximum : <code>number</code>
n for which n! fits in a JavaScript Number without overflowing.

**Kind**: global constant  
<a name="solveConstrained"></a>

## solveConstrained(K, b, k) ⇒ <code>Array.&lt;number&gt;</code>
Solves the bordered system for a kernel Lagrange-multiplier constraint:
    K x + alg * k = b,  (k, x) = 0.

**Kind**: global function  

| Param | Type |
| --- | --- |
| K | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| b | <code>Array.&lt;number&gt;</code> | 
| k | <code>Array.&lt;number&gt;</code> | 

<a name="faceRec"></a>

## faceRec(tv, face) ⇒ <code>Object</code>
Per-face P1 assembly record.

**Kind**: global function  

| Param | Type |
| --- | --- |
| tv | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| face | <code>Array.&lt;number&gt;</code> | 

<a name="gradP1"></a>

## gradP1(tv, coeff) ⇒ <code>Array.&lt;number&gt;</code>
Gradient of the P1 function with nodal values coeff on triangle tv.

**Kind**: global function  

| Param | Type |
| --- | --- |
| tv | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| coeff | <code>Array.&lt;number&gt;</code> | 

<a name="baryOnTriangle"></a>

## baryOnTriangle(pt, tv) ⇒ <code>Array.&lt;number&gt;</code>
Barycentric coordinates of a point in a triangle (area ratios).

**Kind**: global function  

| Param | Type |
| --- | --- |
| pt | <code>Array.&lt;number&gt;</code> | 
| tv | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 

<a name="faceInt"></a>

## faceInt(fr, f, order) ⇒ <code>number</code>
Integrates scalar f over a face using barycentric quadrature.

**Kind**: global function  

| Param | Type | Default |
| --- | --- | --- |
| fr | <code>Object</code> |  | 
| f | <code>function</code> |  | 
| order | <code>number</code> | <code>5</code> | 

<a name="vertexWeight"></a>

## vertexWeight(verts, faces, vIdx) ⇒ <code>Object</code>
Vertex boundary weight zeta_{0,v}^0 (Section 6.3.1).

Solves (6.22) for psi_v^0 in the mean-zero complement of P1 on the boundary
star of v:
    (mu_v grad psi, grad u)_star = phi_v^partial(u) - (eta_v^0, u)_star
where eta_v^0 := 1/|es_partial(v)| (constant on the star) and mu_v :=
chi_{es_d(v)} mu is the Section 6.3 barycenter tent mu (eq. 6.21) restricted
to the vertex star: 1 at each star-face barycenter, 0 on the star boundary.

The weight is exposed as the duality functional (Lemma 6.2)
    (zeta_{0,v}^0, u)_Gamma = (eta,u) + (mu_v grad psi, grad u)
which reproduces phi_v^partial(u) = u(v) for P1 u.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Coords of the star's vertices. |
| faces | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Star faces as index triples. |
| vIdx | <code>number</code> | Index of v in verts. |

<a name="integrateScalar"></a>

## integrateScalar(frs, f, q) ⇒ <code>number</code>
Integrates a scalar over all faces.

**Kind**: global function  

| Param | Type |
| --- | --- |
| frs | <code>Array.&lt;!Object&gt;</code> | 
| f | <code>function</code> | 
| q | <code>Object</code> | 

<a name="areaIntegralScalar"></a>

## areaIntegralScalar(frs, f, q) ⇒ <code>number</code>
Area-weighted integral of a scalar over all faces.

**Kind**: global function  

| Param | Type |
| --- | --- |
| frs | <code>Array.&lt;!Object&gt;</code> | 
| f | <code>function</code> | 
| q | <code>Object</code> | 

<a name="integrateScalar1"></a>

## integrateScalar1(fr, f, q) ⇒ <code>number</code>
Integrates over a single face (area-weighted).

**Kind**: global function  

| Param | Type |
| --- | --- |
| fr | <code>Object</code> | 
| f | <code>function</code> | 
| q | <code>Object</code> | 

<a name="lamOf"></a>

## lamOf(pt, tv, a) ⇒ <code>number</code>
Local (face) barycentric coordinate value of a point for node index a.

**Kind**: global function  

| Param | Type |
| --- | --- |
| pt | <code>Array.&lt;number&gt;</code> | 
| tv | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| a | <code>number</code> | 

<a name="buildN0Space"></a>

## buildN0Space(verts, faces) ⇒ <code>Object</code>
Builds the surface N_0 (Whitney 1-form) trace space over a collection of
boundary faces: a global edge indexing (with a fixed orientation) plus, for
each face, the mapping of its three local edges to global ids and the sign
aligning each local Whitney basis to the global edge orientation.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> |  |
| faces | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Faces as global index triples. |

<a name="whitney1"></a>

## whitney1(pt, tv, grads, i, j) ⇒ <code>Array.&lt;number&gt;</code>
Surface Whitney 1-form W_{ij} = lam_i grad lam_j - lam_j grad lam_i at a
point in the tangent plane of a face.

**Kind**: global function  

| Param | Type |
| --- | --- |
| pt | <code>Array.&lt;number&gt;</code> | 
| tv | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| grads | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| i | <code>number</code> | 
| j | <code>number</code> | 

<a name="scaleVec"></a>

## scaleVec(v, s) ⇒ <code>Array.&lt;number&gt;</code>
Scales a vector by s.

**Kind**: global function  

| Param | Type |
| --- | --- |
| v | <code>Array.&lt;number&gt;</code> | 
| s | <code>number</code> | 

<a name="edgeWeight"></a>

## edgeWeight(verts, faces, ePair) ⇒ <code>Object</code>
Edge boundary weight zeta_{0,e}^1 (Section 6.3.2), lowest-order N_0.

On the extended star of edge e the edge DoF vector

    d_k := int_e W_k . t_e ds

is assembled by 1D Gauss quadrature over the featured edge, and the L2-dual
representative eta_e^1 solves the Whitney mass system

    M eta_e^1 = d.

The weight is exposed as the duality functional

    (zeta_{0,e}^1, u)_Gamma = (eta_e^1, u) = sum_k eta_k (W_k, u)

which is integrable for a general input 1-form u and reproduces the edge
degree of freedom for u whose H(curl) trace lies in N_0 (eq. 6.31):

    (zeta_{0,e}^1, tr^1 u)_Gamma = int_e u . t_e.

(Given this eta_e^1 the Section 6.3.2 right-hand side (6.28) vanishes on the
N_0 trace space, so the modal psi_e^1 term (mu_e curl psi, curl u) drops out
and the L2-dual alone reproduces (6.31).)

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> |  |
| faces | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Faces of the edge star. |
| ePair | <code>Array.&lt;number&gt;</code> | Featured edge as a global vertex pair. |

<a name="rt0Basis"></a>

## rt0Basis(fr) ⇒ <code>Array.&lt;function(Array.&lt;number&gt;): !Array.&lt;number&gt;&gt;</code>
Lowest-order surface Raviart-Thomas (RT_0) basis on a single face.

The three basis functions are affine tangential vector fields, one per edge,
with a constant normal trace of unit flux on their own edge and vanishing
normal flux on the other two (the standard 2D RT_0): for edge e with
opposite vertex p_o, RT_e(x) = (|e| / (2 A)) (x - p_o), projected into the
face's tangent plane.

**Kind**: global function  
**Returns**: <code>Array.&lt;function(Array.&lt;number&gt;): !Array.&lt;number&gt;&gt;</code> - The three RT_0 fields.  

| Param | Type | Description |
| --- | --- | --- |
| fr | <code>Object</code> | A face record {tv, grads, areaAbs, normal}. |

<a name="faceWeight"></a>

## faceWeight(verts, faces, fFace) ⇒ <code>Object</code>
Face boundary weight zeta_{0,f}^2 (Section 6.3.3), lowest-order RT_0.

On the extended star of the featured face, assembles the lowest-order surface
Raviart-Thomas trace basis, its mass matrix, and the face-DoF vector

    d_k := int_f RT_k . n dA   (normal moment over the featured face),

then forms eta_f^2 = M^{-1} d and exposes the duality functional

    (zeta_{0,f}^2, u)_Gamma = (eta_f^2, u) = sum_k eta_k (RT_k, u)

reproducing the face degree of freedom for H(div) traces in RT_0 (eq. 6.36):

    (zeta_{0,f}^2, tr^2 u)_Gamma = int_f u . n.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> |  |
| faces | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Faces of the extended star incl. f. |
| fFace | <code>Array.&lt;number&gt;</code> | Featured face as a global index triple. |

<a name="generateUnitCubeMesh"></a>

## generateUnitCubeMesh(n) ⇒ [<code>Mesh</code>](#Mesh)
Generates a uniform tetrahedral mesh of the unit cube [0,1]^3 using the
Freudenthal (Kuhn) triangulation: each cube is split into 6 tets along
the body diagonal from (0,0,0) to (1,1,1).

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| n | <code>number</code> | Number of cubes per axis (creates n^3 cubes). |

<a name="generateSingleTetMesh"></a>

## generateSingleTetMesh() ⇒ [<code>Mesh</code>](#Mesh)
Generates a single reference tetrahedron mesh.

**Kind**: global function  
<a name="computeL2ErrorScalar"></a>

## computeL2ErrorScalar(mesh, traceProjector, exactFn, projFn) ⇒ <code>number</code>
Computes the L2 error between an exact function and its projection.

err_L2^2 = ΣT ∫_T |u_exact - u_proj|^2 dx

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| mesh | [<code>Mesh</code>](#Mesh) |  |
| traceProjector | [<code>Projector</code>](#Projector) |  |
| exactFn | <code>function</code> |  |
| projFn | <code>function</code> | Function taking (tIdx, point) and returning the projected value at that point. |

<a name="computeL2ErrorVector"></a>

## computeL2ErrorVector(mesh, traceProjector, exactFn, projFn) ⇒ <code>number</code>
Computes the L2 error for a vector-valued projection.

err_L2^2 = ΣT ∫_T |v_exact - v_proj|^2 dx

**Kind**: global function  

| Param | Type |
| --- | --- |
| mesh | [<code>Mesh</code>](#Mesh) | 
| traceProjector | [<code>Projector</code>](#Projector) | 
| exactFn | <code>function</code> | 
| projFn | <code>function</code> | 

<a name="computeH1SemiError"></a>

## computeH1SemiError(mesh, traceProjector, exactFn, projFn) ⇒ <code>number</code>
Computes the H1 semi-norm error (L2 error of the gradient) for scalar projections.
Uses numerical differentiation of the exact function for comparison.

err_H1^2 = ΣT ∫_T |grad(u_exact) - grad(u_proj)|^2 dx

**Kind**: global function  

| Param | Type |
| --- | --- |
| mesh | [<code>Mesh</code>](#Mesh) | 
| traceProjector | [<code>Projector</code>](#Projector) | 
| exactFn | <code>function</code> | 
| projFn | <code>function</code> | 

<a name="estimateMeshSize"></a>

## estimateMeshSize(mesh) ⇒ <code>number</code>
Estimates the mesh size h as the cube root of the average tetrahedron volume
scaled to unit volume, or more simply the maximum edge length.

**Kind**: global function  

| Param | Type |
| --- | --- |
| mesh | [<code>Mesh</code>](#Mesh) | 

<a name="computeRate"></a>

## computeRate(err1, err2, h1, h2) ⇒ <code>number</code>
Computes the observed convergence rate between two successive error measurements.

rate = log(err_1 / err_2) / log(h_1 / h_2)

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| err1 | <code>number</code> | Error on finer mesh. |
| err2 | <code>number</code> | Error on coarser mesh. |
| h1 | <code>number</code> | Mesh size of finer mesh. |
| h2 | <code>number</code> | Mesh size of coarser mesh. |

<a name="runConvergenceStudy"></a>

## runConvergenceStudy(meshes, config) ⇒ <code>Array.&lt;{h: number, l2Err: number, h1Err: (number\|undefined), rateL2: (number\|undefined), rateH1: (number\|undefined)}&gt;</code>
Runs a convergence study on a sequence of meshes.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| meshes | <code>Array.&lt;!Mesh&gt;</code> | Sequence of progressively finer meshes. |
| config | <code>Object</code> |  |
| config.exactScalar | <code>function</code> | Exact scalar function. |
| config.exactVector | <code>function</code> | Exact vector function. |
| [config.l] | <code>number</code> | Form degree (default 0). |
| [config.p] | <code>number</code> | Polynomial degree (default 0). |
| [config.quadratureOrder] | <code>number</code> | Quadrature order (default 3). |

<a name="sort3"></a>

## sort3(a, b, c) ⇒ <code>Array.&lt;number&gt;</code>
Sorts three numbers in ascending order.

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>number</code> | 
| b | <code>number</code> | 
| c | <code>number</code> | 

<a name="triangleQuadrature"></a>

## triangleQuadrature(order) ⇒ <code>Object</code>
Returns quadrature points and weights on the reference triangle.

Note: order 3 contains a negative weight (-9/16). Callers integrating
non-smooth or sign-changing functions should consider a lower order or
a different rule to avoid cancellation issues.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>number</code> | Target polynomial exactness (1, 2, or 3). |

<a name="tetrahedronQuadrature"></a>

## tetrahedronQuadrature(order) ⇒ <code>Object</code>
Returns quadrature points and weights on the reference tetrahedron.

Note: order 3 contains a negative weight (-4/5). Callers integrating
non-smooth or sign-changing functions should consider a lower order or
a different rule to avoid cancellation issues.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>number</code> | Target polynomial exactness (1, 2, or 3). |

<a name="integrateTriangle"></a>

## integrateTriangle(vertices, fn, [order]) ⇒ <code>number</code>
Integrates a scalar function over a triangle using quadrature.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| vertices | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Triangle vertices. |
| fn | <code>function</code> | Scalar function. |
| [order] | <code>number</code> | Quadrature order (default 2). |

<a name="barycentricToCartesian"></a>

## barycentricToCartesian(vertices, bary) ⇒ <code>Array.&lt;number&gt;</code>
Maps barycentric coordinates to a Cartesian point.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| vertices | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Vertices of the element. |
| bary | <code>Array.&lt;number&gt;</code> | Barycentric coordinates. |

<a name="lineQuadrature"></a>

## lineQuadrature(order) ⇒ <code>Object</code>
Returns quadrature points and weights on the reference interval [0, 1].

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>number</code> | Target polynomial exactness (1, 2, or 3). |

**Example**  
```js
const {points, weights} = lineQuadrature(2);
const integral = points.reduce((s, x, i) => s + weights[i] * f(x), 0);
```
<a name="compositeTetrahedronQuadrature"></a>

## compositeTetrahedronQuadrature(order) ⇒ <code>Object</code>
Returns a composite quadrature rule by subdividing the reference tetrahedron
into 4 sub-tetrahedra via the centroid and applying the base rule on each.
This increases the number of quadrature points, ensuring the mass matrix
for polynomial spaces up to degree 3 remains full-rank.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>number</code> | Base quadrature order. |

<a name="integrateTetrahedron"></a>

## integrateTetrahedron(vertices, fn, [order]) ⇒ <code>number</code>
Integrates a scalar function over a tetrahedron using quadrature.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| vertices | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Tetrahedron vertices. |
| fn | <code>function</code> | Scalar function. |
| [order] | <code>number</code> | Quadrature order (default 2). |

<a name="triangleFrame"></a>

## triangleFrame(verts) ⇒ <code>Object</code>
Returns the unit outward normal and two orthonormal tangent directions of a
triangle, plus the oriented area-normal (cross product of two edges).

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | The three vertices [p0, p1, p2]. |

<a name="gradGamma"></a>

## gradGamma(pt, verts, u, [h]) ⇒ <code>Array.&lt;number&gt;</code>
Surface gradient of a scalar function at a point on a triangle.
Projects the ambient gradient onto the tangent plane.

**Kind**: global function  
**Returns**: <code>Array.&lt;number&gt;</code> - Tangential R^3 vector.  

| Param | Type | Description |
| --- | --- | --- |
| pt | <code>Array.&lt;number&gt;</code> | The point (must lie on the triangle). |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Triangle vertices. |
| u | <code>function</code> | Scalar function. |
| [h] | <code>number</code> | Finite-difference step. |

<a name="rotGamma"></a>

## rotGamma(pt, verts, u) ⇒ <code>Array.&lt;number&gt;</code>
Surface rotated gradient: rot_Gamma(u) = n x grad_Gamma(u)  (eq. 2.10).

**Kind**: global function  
**Returns**: <code>Array.&lt;number&gt;</code> - Tangential R^3 vector.  

| Param | Type |
| --- | --- |
| pt | <code>Array.&lt;number&gt;</code> | 
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| u | <code>function</code> | 

<a name="curlGamma"></a>

## curlGamma(pt, verts, v, [h]) ⇒ <code>number</code>
Surface scalar curl of a tangential vector field: the adjoint of rot_Gamma
under the L2 inner product (eq. 2.14a).

On a flat triangle with orthonormal tangent frame {t1, t2} the field
v = v1 t1 + v2 t2 has curl_Gamma(v) = dv2/dt1 - dv1/dt2 (a scalar).  Use the
weak/adjoint relation to evaluate it pointwise via first-order differences
in the tangent frame.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pt | <code>Array.&lt;number&gt;</code> |  |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> |  |
| v | <code>function</code> | Tangential R^3 vector field. |
| [h] | <code>number</code> |  |

<a name="divGamma"></a>

## divGamma(pt, verts, v, [h]) ⇒ <code>number</code>
Surface divergence of a tangential vector field: -(adjoint of grad_Gamma)
under the L2 inner product (eq. 2.14b).

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pt | <code>Array.&lt;number&gt;</code> |  |
| verts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> |  |
| v | <code>function</code> | Tangential R^3 vector field. |
| [h] | <code>number</code> |  |

<a name="muTent"></a>

## muTent(faceVerts, barycenter, pt) ⇒ <code>number</code>
Barycenter tent function mu on the Alfeld-split boundary mesh (Section 6.3,
eq. 6.21; line 1559).

Let mu be the globally continuous function on Gamma that is piecewise affine
on the Alfeld-split boundary mesh, vanishes on every face boundary (the
original boundary edges/vertices), and takes the value one at each face
barycenter.  On each boundary face the Alfeld split introduces the face
barycenter m and partitions the face into three sub-triangles {v_i, v_j, m};
on the sub-triangle {vi, vj, m} the tent is linear with values
(mu(vi), mu(vj), mu(m)) = (0, 0, 1), i.e. mu equals the barycentric
coordinate of m (the third sub-triangle vertex).

The per-simplex weights are

    mu_sigma := chi_{es_partial(sigma)} * mu

i.e. the barycenter tent restricted to the boundary extended star of sigma.

**Kind**: global function  
**Returns**: <code>number</code> - mu(pt) in [0, 1].  

| Param | Type | Description |
| --- | --- | --- |
| faceVerts | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | The three original face vertices   [v0, v1, v2] (NOT including the barycenter). |
| barycenter | <code>Array.&lt;number&gt;</code> | The face barycenter [x, y, z]. |
| pt | <code>Array.&lt;number&gt;</code> | Query point. |

<a name="dot"></a>

## dot(a, b) ⇒ <code>number</code>
Computes the dot product of two 3D vectors.

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>Array.&lt;number&gt;</code> | 
| b | <code>Array.&lt;number&gt;</code> | 

<a name="tetDeterminant"></a>

## tetDeterminant(v0, v1, v2, v3) ⇒ <code>number</code>
Computes the determinant (scalar triple product) of the tetrahedron with
vertices v0, v1, v2, v3.  The absolute value divided by 6 equals the volume.

**Kind**: global function  

| Param | Type |
| --- | --- |
| v0 | <code>Array.&lt;number&gt;</code> | 
| v1 | <code>Array.&lt;number&gt;</code> | 
| v2 | <code>Array.&lt;number&gt;</code> | 
| v3 | <code>Array.&lt;number&gt;</code> | 

<a name="tetVolume"></a>

## tetVolume(v0, v1, v2, v3) ⇒ <code>number</code>
Computes the geometric volume of a tetrahedron.

**Kind**: global function  

| Param | Type |
| --- | --- |
| v0 | <code>Array.&lt;number&gt;</code> | 
| v1 | <code>Array.&lt;number&gt;</code> | 
| v2 | <code>Array.&lt;number&gt;</code> | 
| v3 | <code>Array.&lt;number&gt;</code> | 

<a name="cross"></a>

## cross(a, b) ⇒ <code>Array.&lt;number&gt;</code>
Computes the cross product of two 3D vectors.

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>Array.&lt;number&gt;</code> | 
| b | <code>Array.&lt;number&gt;</code> | 

<a name="subtract"></a>

## subtract(a, b) ⇒ <code>Array.&lt;number&gt;</code>
Subtracts vector b from vector a.

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>Array.&lt;number&gt;</code> | 
| b | <code>Array.&lt;number&gt;</code> | 

<a name="norm"></a>

## norm(v) ⇒ <code>number</code>
Computes the Euclidean norm of a vector.

**Kind**: global function  

| Param | Type |
| --- | --- |
| v | <code>Array.&lt;number&gt;</code> | 

<a name="subtractInto"></a>

## subtractInto(a, b, out) ⇒ <code>Array.&lt;number&gt;</code>
In-place vector subtraction: out = a - b.

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>Array.&lt;number&gt;</code> | 
| b | <code>Array.&lt;number&gt;</code> | 
| out | <code>Array.&lt;number&gt;</code> | 

<a name="crossInto"></a>

## crossInto(a, b, out) ⇒ <code>Array.&lt;number&gt;</code>
In-place cross product: out = a x b.

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>Array.&lt;number&gt;</code> | 
| b | <code>Array.&lt;number&gt;</code> | 
| out | <code>Array.&lt;number&gt;</code> | 

<a name="triangleArea"></a>

## triangleArea(p1, p2, p3) ⇒ <code>number</code>
Computes the area of a triangle given its three vertices.

**Kind**: global function  

| Param | Type |
| --- | --- |
| p1 | <code>Array.&lt;number&gt;</code> | 
| p2 | <code>Array.&lt;number&gt;</code> | 
| p3 | <code>Array.&lt;number&gt;</code> | 

<a name="zeros"></a>

## zeros(rows, cols) ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code>
Creates a zero-initialized dense matrix.

**Kind**: global function  

| Param | Type |
| --- | --- |
| rows | <code>number</code> | 
| cols | <code>number</code> | 

<a name="infinityNorm"></a>

## infinityNorm(a) ⇒ <code>number</code>
Computes the infinity norm (maximum absolute row sum) of a matrix.

**Kind**: global function  

| Param | Type |
| --- | --- |
| a | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 

<a name="luSolve"></a>

## luSolve(a, b) ⇒ <code>Array.&lt;number&gt;</code>
Solves Ax = b using Gaussian elimination with partial pivoting and row
equilibration (pivot scaling).

The matrix is scaled so that each row has max-norm 1 before elimination,
reducing the risk of false singularity claims on poorly scaled systems.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| a | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | Dense square matrix (not modified). |
| b | <code>Array.&lt;number&gt;</code> |  |

<a name="inverse3x3"></a>

## inverse3x3(m) ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code>
Computes the inverse of a 3x3 matrix.

**Kind**: global function  

| Param | Type |
| --- | --- |
| m | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 

<a name="solve3x3"></a>

## solve3x3(a, b) ⇒ <code>Array.&lt;number&gt;</code>
Solves a 3x3 linear system Ax = b using Cramer's rule.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| a | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 3x3 matrix. |
| b | <code>Array.&lt;number&gt;</code> | 3-vector. |

<a name="factorial"></a>

## factorial(n) ⇒ <code>number</code>
Computes the factorial n!.

**Kind**: global function  
**Throws**:

- <code>Error</code> If n > MAX_SAFE_FACTORIAL (would overflow Number.MAX_VALUE).


| Param | Type | Description |
| --- | --- | --- |
| n | <code>number</code> | Non-negative integer. |

<a name="numericalGradient"></a>

## numericalGradient(u, pt, [h]) ⇒ <code>Array.&lt;number&gt;</code>
Numerical gradient of a scalar function using central differences.

**Kind**: global function  

| Param | Type |
| --- | --- |
| u | <code>function</code> | 
| pt | <code>Array.&lt;number&gt;</code> | 
| [h] | <code>number</code> | 

