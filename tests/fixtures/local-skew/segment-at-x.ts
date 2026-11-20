import type { LocalSkewSegment } from "lib/utils/local-skew/pcb-differential-pair-local-skew"

/**
 * The horizontal overlay segment that covers `x`, optionally at height `y`.
 * Throws when there is none, so a test can't pass on a missing segment.
 */
export function segmentAtX({
  segments,
  x,
  y,
}: {
  segments: LocalSkewSegment[]
  x: number
  y?: number
}): LocalSkewSegment {
  const segment = segments.find(
    (candidate) =>
      candidate.start.y === candidate.end.y &&
      (y === undefined || Math.abs(candidate.start.y - y) < 1e-9) &&
      Math.min(candidate.start.x, candidate.end.x) <= x &&
      Math.max(candidate.start.x, candidate.end.x) >= x,
  )
  if (!segment) throw new Error(`No horizontal segment covers x = ${x}`)
  return segment
}
