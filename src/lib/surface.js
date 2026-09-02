/**
 * Surface differential operators and geometry on the Alfeld-split boundary.
 *
 * Implements the surface operators grad_Gamma, curl_Gamma, div_Gamma, rot_Gamma
 * from Section 2.3 of the paper, together with the barycenter tent function mu
 * used by the sequential boundary-weight construction (Section 6.3).
 *
 * Surface vectors are R^3-valued and tangential to the boundary.  On each
 * Alfeld sub-triangle the surface plane is spanned by two tangent directions;
 * the operators act piecewise (polynomial on each sub-triangle, discontinuous
 * across sub-triangle edges where the face normal changes).
 */

import { cross, dot, norm } from './utils.js'
import { ValidateError } from './errors.js'

/**
 * Returns the unit outward normal and two orthonormal tangent directions of a
 * triangle, plus the oriented area-normal (cross product of two edges).
 *
 * @param {!Array<!Array<number>>} verts - The three vertices [p0, p1, p2].
 * @return {{normal: !Array<number>, tangent1: !Array<number>, tangent2: !Array<number>, areaNormal: !Array<number>, area: number}}
 */
export function triangleFrame (verts) {
  const e1 = [verts[1][0] - verts[0][0], verts[1][1] - verts[0][1], verts[1][2] - verts[0][2]]
  const e2 = [verts[2][0] - verts[0][0], verts[2][1] - verts[0][1], verts[2][2] - verts[0][2]]
  const areaNormal = cross(e1, e2)
  const area = 0.5 * norm(areaNormal)
  const normal = area < 1e-14 ? [0, 0, 1] : areaNormal.map((x) => x / (2 * area))
  let t1 = [areaNormal[1], -areaNormal[0], 0]
  if (norm(t1) < 1e-14) {
    t1 = [areaNormal[2], 0, -areaNormal[0]]
  }
  t1 = t1.map((x) => x / norm(t1))
  const t2 = cross(normal, t1)
  return { normal, tangent1: t1, tangent2: t2, areaNormal, area }
}

/**
 * Surface gradient of a scalar function at a point on a triangle.
 * Projects the ambient gradient onto the tangent plane.
 *
 * @param {!Array<number>} pt - The point (must lie on the triangle).
 * @param {!Array<!Array<number>>} verts - Triangle vertices.
 * @param {function(!Array<number>): number} u - Scalar function.
 * @param {number=} h - Finite-difference step.
 * @return {!Array<number>} Tangential R^3 vector.
 */
export function gradGamma (pt, verts, u, h = 1e-6) {
  const { normal } = triangleFrame(verts)
  const amb = [
    (u([pt[0] + h, pt[1], pt[2]]) - u([pt[0] - h, pt[1], pt[2]])) / (2 * h),
    (u([pt[0], pt[1] + h, pt[2]]) - u([pt[0], pt[1] - h, pt[2]])) / (2 * h),
    (u([pt[0], pt[1], pt[2] + h]) - u([pt[0], pt[1], pt[2] - h])) / (2 * h)
  ]
  const n = amb[0] * normal[0] + amb[1] * normal[1] + amb[2] * normal[2]
  return [amb[0] - n * normal[0], amb[1] - n * normal[1], amb[2] - n * normal[2]]
}

/**
 * Surface rotated gradient: rot_Gamma(u) = n x grad_Gamma(u)  (eq. 2.10).
 * @param {!Array<number>} pt
 * @param {!Array<!Array<number>>} verts
 * @param {function(!Array<number>): number} u
 * @return {!Array<number>} Tangential R^3 vector.
 */
export function rotGamma (pt, verts, u) {
  const { normal } = triangleFrame(verts)
  const g = gradGamma(pt, verts, u)
  return cross(normal, g)
}

/**
 * Surface scalar curl of a tangential vector field: the adjoint of rot_Gamma
 * under the L2 inner product (eq. 2.14a).
 *
 * On a flat triangle with orthonormal tangent frame {t1, t2} the field
 * v = v1 t1 + v2 t2 has curl_Gamma(v) = dv2/dt1 - dv1/dt2 (a scalar).  Use the
 * weak/adjoint relation to evaluate it pointwise via first-order differences
 * in the tangent frame.
 *
 * @param {!Array<number>} pt
 * @param {!Array<!Array<number>>} verts
 * @param {function(!Array<number>): !Array<number>} v - Tangential R^3 vector field.
 * @param {number=} h
 * @return {number}
 */
export function curlGamma (pt, verts, v, h = 1e-6) {
  const { tangent1: t1, tangent2: t2 } = triangleFrame(verts)
  const v1 = (p) => dot(v(p), t1)
  const v2 = (p) => dot(v(p), t2)
  const right = v2([pt[0] + h * t1[0], pt[1] + h * t1[1], pt[2] + h * t1[2]])
  const left = v2([pt[0] - h * t1[0], pt[1] - h * t1[1], pt[2] - h * t1[2]])
  const up = v1([pt[0] + h * t2[0], pt[1] + h * t2[1], pt[2] + h * t2[2]])
  const down = v1([pt[0] - h * t2[0], pt[1] - h * t2[1], pt[2] - h * t2[2]])
  // adjoint of rot_Gamma = n x grad_Gamma: curl_Gamma v = dv1/dt2 - dv2/dt1
  return (up - down) / (2 * h) - (right - left) / (2 * h)
}

/**
 * Surface divergence of a tangential vector field: -(adjoint of grad_Gamma)
 * under the L2 inner product (eq. 2.14b).
 * @param {!Array<number>} pt
 * @param {!Array<!Array<number>>} verts
 * @param {function(!Array<number>): !Array<number>} v - Tangential R^3 vector field.
 * @param {number=} h
 * @return {number}
 */
export function divGamma (pt, verts, v, h = 1e-6) {
  const { tangent1: t1, tangent2: t2 } = triangleFrame(verts)
  const v1 = (p) => dot(v(p), t1)
  const v2 = (p) => dot(v(p), t2)
  const right = v1([pt[0] + h * t1[0], pt[1] + h * t1[1], pt[2] + h * t1[2]])
  const left = v1([pt[0] - h * t1[0], pt[1] - h * t1[1], pt[2] - h * t1[2]])
  const up = v2([pt[0] + h * t2[0], pt[1] + h * t2[1], pt[2] + h * t2[2]])
  const down = v2([pt[0] - h * t2[0], pt[1] - h * t2[1], pt[2] - h * t2[2]])
  return (right - left) / (2 * h) + (up - down) / (2 * h)
}

/**
 * Barycenter tent function mu on the Alfeld-split boundary mesh.
 *
 * On each boundary face the Alfeld split introduces the face barycenter m as a
 * vertex and partitions the face into three sub-triangles {v_i, v_{i+1}, m}.
 * The tent mu is the continuous piecewise-linear function that equals 1 at
 * every original boundary vertex and 0 at every barycenter.  On the
 * sub-triangle {vi, vj, m} it is linear with values (1, 1, 0), i.e. the sum of
 * the two vertex barycentric coordinates.
 *
 * @param {!Array<!Array<number>>} faceVerts - The three original face vertices
 *   [v0, v1, v2] (NOT including the barycenter).
 * @param {!Array<number>} barycenter - The face barycenter [x, y, z].
 * @param {!Array<number>} pt - Query point.
 * @return {number} mu(pt) in [0, 1].
 */
export function muTent (faceVerts, barycenter, pt) {
  // Find which of the three sub-triangles contains pt and evaluate the tent.
  for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) {
    const c = triBarycentric(faceVerts[i], faceVerts[j], barycenter, pt)
    if (c && c[0] >= -1e-9 && c[1] >= -1e-9 && c[2] >= -1e-9 && Number.isFinite(c[0])) {
      const sum = c[0] + c[1]
      return Math.max(0, Math.min(1, sum))
    }
  }
  // Fallback: point on an edge shared by two sub-triangles or at barycenter.
  const m = barycenter
  const rp = norm([pt[0] - m[0], pt[1] - m[1], pt[2] - m[2]])
  const dmax = Math.max(
    norm([faceVerts[0][0] - m[0], faceVerts[0][1] - m[1], faceVerts[0][2] - m[2]]),
    norm([faceVerts[1][0] - m[0], faceVerts[1][1] - m[1], faceVerts[1][2] - m[2]]),
    norm([faceVerts[2][0] - m[0], faceVerts[2][1] - m[1], faceVerts[2][2] - m[2]])
  )
  if (dmax < 1e-18) return 0
  return Math.max(0, Math.min(1, 1 - rp / dmax))
}

/** @private */
function triBarycentric (a, b, c, pt) {
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n = cross(e1, e2)
  const area = (p, q, r) => dot(cross(
    [q[0] - p[0], q[1] - p[1], q[2] - p[2]],
    [r[0] - p[0], r[1] - p[1], r[2] - p[2]]), n)
  const totalA = area(a, b, c)
  if (Math.abs(totalA) < 1e-30) return null
  return [
    area(pt, b, c) / totalA,
    area(a, pt, c) / totalA,
    area(a, b, pt) / totalA
  ]
}
