export type Point = { x: number; y: number }

const cross = (ax: number, ay: number, bx: number, by: number) => {
  return ax * by - ay * bx
}

export function segmentIntersection(
  p1: Point,
  p2: Point,
  q1: Point,
  q2: Point,
  tol: number,
): Point | null {
  const r = { x: p2.x - p1.x, y: p2.y - p1.y }
  const s = { x: q2.x - q1.x, y: q2.y - q1.y }
  const rxs = cross(r.x, r.y, s.x, s.y)
  const q_p = { x: q1.x - p1.x, y: q1.y - p1.y }
  const q_pxr = cross(q_p.x, q_p.y, r.x, r.y)

  if (Math.abs(rxs) < tol && Math.abs(q_pxr) < tol) return null
  if (Math.abs(rxs) < tol && Math.abs(q_pxr) >= tol) return null

  const t = cross(q_p.x, q_p.y, s.x, s.y) / rxs
  const u = cross(q_p.x, q_p.y, r.x, r.y) / rxs

  if (t < -tol || t > 1 + tol || u < -tol || u > 1 + tol) return null

  return { x: p1.x + t * r.x, y: p1.y + t * r.y }
}
