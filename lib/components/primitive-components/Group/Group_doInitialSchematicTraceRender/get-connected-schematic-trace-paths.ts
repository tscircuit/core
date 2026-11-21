import { doSegmentsIntersect } from "@tscircuit/math-utils"
import type { Point } from "./segment-intersection"

/**
 * Find physically connected paths within one net on one sheet. Points are in
 * schematic-world mm, +X right and +Y up (right-handed).
 */
export function getConnectedSchematicTracePaths({
  tracePath,
  sameNetTracePaths,
}: {
  tracePath: Point[]
  sameNetTracePaths: Point[][]
}): Point[][] {
  const connectedPaths = new Set([tracePath])
  // Set iteration visits newly added paths too, following each shared junction.
  for (const connectedPath of connectedPaths) {
    for (const candidatePath of sameNetTracePaths) {
      if (connectedPaths.has(candidatePath)) continue
      const touchesConnectedPath = candidatePath.some(
        (point, index) =>
          index > 0 &&
          connectedPath.some(
            (connectedPoint, connectedIndex) =>
              connectedIndex > 0 &&
              doSegmentsIntersect(
                candidatePath[index - 1]!,
                point,
                connectedPath[connectedIndex - 1]!,
                connectedPoint,
              ),
          ),
      )
      if (!touchesConnectedPath) continue
      connectedPaths.add(candidatePath)
    }
  }
  return [...connectedPaths]
}
