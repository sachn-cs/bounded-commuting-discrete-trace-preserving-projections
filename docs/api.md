## Classes

<dl>
<dt><a href="#BoundaryWeightComputer">BoundaryWeightComputer</a></dt>
<dd><p>Computes boundary patch weights used by the trace-preserving projection
operators.  For each boundary vertex, it assembles a surface-patch stiffness
matrix on the Alfeld-split star, solves a constrained Laplace problem to
obtain the weight functions psi, and collects edge tangents and face normals.</p>
<p>Local failures (e.g. degenerate patches) emit warnings rather than throwing
so that a single bad element does not halt the entire mesh projection.</p>
</dd>
<dt><a href="#MeshValidationError">MeshValidationError</a></dt>
<dd><p>Thrown when mesh input data fails validation.</p>
</dd>
<dt><a href="#ProjectionError">ProjectionError</a></dt>
<dd><p>Thrown when a projection cannot be computed.</p>
</dd>
<dt><a href="#SingularMatrixError">SingularMatrixError</a></dt>
<dd><p>Thrown when a linear system is singular or numerically ill-conditioned.</p>
</dd>
<dt><a href="#HigherOrderProjection">HigherOrderProjection</a></dt>
<dd><p>Higher-order projection framework implementing Section 7 of the paper.</p>
<p>For polynomial degree p &gt;= 4 on H^1 (l=0), the projection Pi^l_p is built
from the lowest-order projection by adding bubble corrections on
Alfeld-split patches.  For L2 (l=3) with p &gt;= 1, a Bernstein-basis
L2 projection is used instead.</p>
<p>For p = 1, 2, 3 on H^1 the bubble space is empty (the product
b = lambda_0 * lambda_1 * lambda_2 * lambda_3 already has degree 4),
so projectHp returns the lowest-order projection without enrichment.</p>
</dd>
<dt><a href="#LocalSolver">LocalSolver</a></dt>
<dd><p>Static utility for assembling surface-patch stiffness matrices and solving
constrained linear systems during boundary weight computation.</p>
<p>The constraint enforcement uses a simple row-replacement approach that works
well for small patch sizes (valence &lt; 20).  For production-scale patches a
Lagrange-multiplier or projected-gradient method is preferable.</p>
</dd>
<dt><a href="#MeshRefinement">MeshRefinement</a></dt>
<dd><p>Mesh refinement operators implementing Alfeld face splitting (Section 6.1.3)
and Worsey-Farin tetrahedron splitting (Section 6.1.4).</p>
<p>This class mutates the underlying Mesh by appending barycenter vertices.
It stores the refinement data (sub-triangles, sub-tetrahedra) separately so
that Mesh remains a pure data structure.</p>
<p>Both splits are idempotent: calling them more than once is a no-op.</p>
</dd>
<dt><a href="#Mesh">Mesh</a></dt>
<dd><p>Tetrahedral mesh data structure with topological connectivity and boundary
extraction.  This class is intentionally a <em>pure data structure</em>; mesh
refinement operators (Alfeld split, Worsey-Farin split) live in
<a href="#MeshRefinement">MeshRefinement</a>.</p>
</dd>
<dt><a href="#PointLocator">PointLocator</a></dt>
<dd><p>Axis-aligned bounding box (AABB) tree for O(log N) point-in-tetrahedron
queries.</p>
<p>The tree is built by recursively splitting tetrahedra along the longest
axis at the median centroid, guaranteeing a balanced tree.  Leaf nodes
store up to maxLeafSize tetrahedra and are tested exhaustively.</p>
</dd>
<dt><a href="#TraceProjector">TraceProjector</a></dt>
<dd><p>TRACEPROJECTOR: Bounded, Commuting, Discrete-trace Preserving Projections.</p>
<p>Implements the de Rham projection operators Pi^l for l = 0,1,2,3 on
tetrahedral meshes with boundary-aware trace preservation.</p>
<p><strong>Coupling note:</strong> This class accesses mesh data through the <a href="#Mesh">Mesh</a>
public API (getters for vertices, faces, edges, boundary flags, orientation
signs, etc.).  Swapping in a different mesh implementation requires only that
the new class implements the same getter interface.</p>
</dd>
<dt><a href="#Whitney">Whitney</a></dt>
<dd><p>Barycentric coordinate computation and Whitney finite-element basis
functions on a tetrahedral mesh.</p>
<p>Provides the Whitney 1-forms (Nedelec edge basis) and 2-forms
(Raviart-Thomas face basis) used by the H(curl) and H(div) projectors.
All per-tet geometry (edge matrix, inverse, gradients) is cached at
construction time for efficient repeated evaluation.</p>
</dd>
<dt><a href="#H1Projector">H1Projector</a></dt>
<dd><p>Lowest-order H1 (l=0) vertex-based projector implementing Pi^0.</p>
<p>Projects scalar functions onto the space of continuous piecewise-linear
functions (P1 Lagrange) on a tetrahedral mesh.  Boundary vertices use
weighted surface-patch integrals (computed by <a href="#BoundaryWeightComputer">BoundaryWeightComputer</a>)
to ensure trace preservation.  Interior vertices use nodal interpolation.</p>
</dd>
<dt><a href="#HcurlProjector">HcurlProjector</a></dt>
<dd><p>Lowest-order H(curl) (l=1) edge-based projector implementing Pi^1.</p>
<p>Projects vector functions onto the Nédélec first-kind (Whitney 1-form)
space.  Boundary edges use exact tangential-trace degrees of freedom
(∫_e u·t ds); interior edges use midpoint evaluation of the tangential
component.</p>
</dd>
<dt><a href="#HdivProjector">HdivProjector</a></dt>
<dd><p>Lowest-order H(div) (l=2) face-based projector implementing Pi^2.</p>
<p>Projects vector functions onto the Raviart-Thomas (Whitney 2-form) space.
Boundary faces use exact normal-flux degrees of freedom (∫_f u·n dA);
interior faces use barycenter evaluation of the normal component.</p>
</dd>
<dt><a href="#L2Projector">L2Projector</a></dt>
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
<dt><a href="#computeL2ErrorScalar">computeL2ErrorScalar(mesh, traceProjector, exactFn, projFn)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the L2 error between an exact function and its projection.</p>
<p>err_L2^2 = Σ_T ∫_T |u_exact - u_proj|^2 dx</p>
</dd>
<dt><a href="#computeL2ErrorVector">computeL2ErrorVector(mesh, traceProjector, exactFn, projFn)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the L2 error for a vector-valued projection.</p>
<p>err_L2^2 = Σ_T ∫_T |v_exact - v_proj|^2 dx</p>
</dd>
<dt><a href="#computeH1SemiError">computeH1SemiError(mesh, traceProjector, exactFn, projFn)</a> ⇒ <code>number</code></dt>
<dd><p>Computes the H1 semi-norm error (L2 error of the gradient) for scalar projections.
Uses numerical differentiation of the exact function for comparison.</p>
<p>err_H1^2 = Σ_T ∫_T |grad(u_exact) - grad(u_proj)|^2 dx</p>
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
<dt><a href="#generateUnitCubeMesh">generateUnitCubeMesh(n)</a> ⇒ <code><a href="#Mesh">Mesh</a></code></dt>
<dd><p>Generates a uniform tetrahedral mesh of the unit cube [0,1]^3 using the
Freudenthal (Kuhn) triangulation: each cube is split into 6 tets along
the body diagonal from (0,0,0) to (1,1,1).</p>
</dd>
<dt><a href="#generateSingleTetMesh">generateSingleTetMesh()</a> ⇒ <code><a href="#Mesh">Mesh</a></code></dt>
<dd><p>Generates a single reference tetrahedron mesh.</p>
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
</dl>

<a name="LocalSolver"></a>

## LocalSolver
Static utility for assembling surface-patch stiffness matrices and solving
constrained linear systems during boundary weight computation.

The constraint enforcement uses a simple row-replacement approach that works
well for small patch sizes (valence < 20).  For production-scale patches a
Lagrange-multiplier or projected-gradient method is preferable.

**Kind**: global class  

* [LocalSolver](#LocalSolver)
    * [.assembleSurfaceStiffness(vertices, triangles)](#LocalSolver.assembleSurfaceStiffness) ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code>
    * [.solveWithConstraint(K, b, [onWarning])](#LocalSolver.solveWithConstraint) ⇒ <code>Array.&lt;number&gt;</code>

<a name="LocalSolver.assembleSurfaceStiffness"></a>

### LocalSolver.assembleSurfaceStiffness(vertices, triangles) ⇒ <code>Array.&lt;!Array.&lt;number&gt;&gt;</code>
Assembles the surface stiffness matrix for -Delta_Gamma.

**Kind**: static method of [<code>LocalSolver</code>](#LocalSolver)  

| Param | Type |
| --- | --- |
| vertices | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 
| triangles | <code>Array.&lt;!Array.&lt;number&gt;&gt;</code> | 

<a name="LocalSolver.solveWithConstraint"></a>

### LocalSolver.solveWithConstraint(K, b, [onWarning]) ⇒ <code>Array.&lt;number&gt;</code>
Solves K x = b with a mean-zero constraint sum(x) = 0.

This implementation enforces the constraint by replacing the last row of K
with ones and setting the last entry of b to zero. This is a simple
textbook approach that works well for small patch sizes (valence < 20).
It destroys symmetry and can degrade conditioning for larger systems; for
production-scale patches a Lagrange-multiplier or projected-gradient method
is preferable.

**Kind**: static method of [<code>LocalSolver</code>](#LocalSolver)  

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
<a name="computeL2ErrorScalar"></a>

## computeL2ErrorScalar(mesh, traceProjector, exactFn, projFn) ⇒ <code>number</code>
Computes the L2 error between an exact function and its projection.

err_L2^2 = Σ_T ∫_T |u_exact - u_proj|^2 dx

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| mesh | [<code>Mesh</code>](#Mesh) |  |
| traceProjector | [<code>TraceProjector</code>](#TraceProjector) |  |
| exactFn | <code>function</code> |  |
| projFn | <code>function</code> | Function taking (tIdx, point) and returning the projected value at that point. |

<a name="computeL2ErrorVector"></a>

## computeL2ErrorVector(mesh, traceProjector, exactFn, projFn) ⇒ <code>number</code>
Computes the L2 error for a vector-valued projection.

err_L2^2 = Σ_T ∫_T |v_exact - v_proj|^2 dx

**Kind**: global function  

| Param | Type |
| --- | --- |
| mesh | [<code>Mesh</code>](#Mesh) | 
| traceProjector | [<code>TraceProjector</code>](#TraceProjector) | 
| exactFn | <code>function</code> | 
| projFn | <code>function</code> | 

<a name="computeH1SemiError"></a>

## computeH1SemiError(mesh, traceProjector, exactFn, projFn) ⇒ <code>number</code>
Computes the H1 semi-norm error (L2 error of the gradient) for scalar projections.
Uses numerical differentiation of the exact function for comparison.

err_H1^2 = Σ_T ∫_T |grad(u_exact) - grad(u_proj)|^2 dx

**Kind**: global function  

| Param | Type |
| --- | --- |
| mesh | [<code>Mesh</code>](#Mesh) | 
| traceProjector | [<code>TraceProjector</code>](#TraceProjector) | 
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

