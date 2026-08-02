import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export const areAllPcbPrimitivesOverlapping = (
  pcbPrimitives: PrimitiveComponent[],
): boolean => {
  if (pcbPrimitives.length <= 1) return true

  // Get bounds of all primitives.
  //
  // `_getPcbCircuitJsonBounds()` is implemented with two opposite Y
  // conventions across the codebase: Cutout, PlatedHole and SmtPad's
  // rect/polygon shapes return top > bottom, while Via, PcbVia, Hole and
  // SmtPad's circle/pill/rotated_* shapes return top < bottom. The overlap
  // test below only holds for the first convention, so the axes are
  // normalised here rather than assumed.
  const bounds = pcbPrimitives.map((p) => {
    const circuitBounds = p._getPcbCircuitJsonBounds()
    return {
      left: Math.min(circuitBounds.bounds.left, circuitBounds.bounds.right),
      right: Math.max(circuitBounds.bounds.left, circuitBounds.bounds.right),
      top: Math.max(circuitBounds.bounds.top, circuitBounds.bounds.bottom),
      bottom: Math.min(circuitBounds.bounds.top, circuitBounds.bounds.bottom),
    }
  })

  // Build an adjacency matrix representing overlapping primitives
  const overlaps: boolean[][] = Array(bounds.length)
    .fill(false)
    .map(() => Array(bounds.length).fill(false))

  // Fill adjacency matrix
  for (let i = 0; i < bounds.length; i++) {
    for (let j = i + 1; j < bounds.length; j++) {
      const a = bounds[i]
      const b = bounds[j]

      // Check if bounding boxes overlap
      overlaps[i][j] = overlaps[j][i] = !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom > b.top ||
        a.top < b.bottom
      )
    }
  }

  // Use DFS to check if all primitives are connected
  const visited = new Set<number>()
  const dfs = (node: number) => {
    visited.add(node)
    for (let i = 0; i < bounds.length; i++) {
      if (overlaps[node][i] && !visited.has(i)) {
        dfs(i)
      }
    }
  }

  // Start DFS from first primitive
  dfs(0)

  // Check if all primitives were visited
  return visited.size === bounds.length
}
