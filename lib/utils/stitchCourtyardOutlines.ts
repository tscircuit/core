import type { Point } from "circuit-json"

interface CourtyardOutlineElement {
  type: "pcb_courtyard_outline"
  layer?: "top" | "bottom"
  outline: Point[]
  [key: string]: any
}

const pointsMatch = (p1: Point, p2: Point, tolerance = 1e-4): boolean => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y) < tolerance
}

/**
 * Stitches disconnected or segmented 2-point courtyard lines into closed polygon outlines.
 * Stock KiCad footprints often define courtyards using separate fp_line segments.
 * This stitches those segments into closed rings to satisfy DRC and placement checks.
 */
export function stitchCourtyardOutlines<T extends CourtyardOutlineElement>(
  elements: T[],
): T[] {
  const result: T[] = []
  const byLayer = new Map<string, T[]>()

  for (const elm of elements) {
    const layer = elm.layer ?? "top"
    if (!byLayer.has(layer)) {
      byLayer.set(layer, [])
    }
    byLayer.get(layer)!.push(elm)
  }

  for (const [, layerElements] of byLayer.entries()) {
    const closedOutlines: T[] = []
    const segments: Array<{ p1: Point; p2: Point; original: T }> = []

    for (const elm of layerElements) {
      if (elm.outline.length >= 3) {
        closedOutlines.push(elm)
      } else if (elm.outline.length === 2) {
        segments.push({
          p1: elm.outline[0]!,
          p2: elm.outline[1]!,
          original: elm,
        })
      }
    }

    const used = new Set<number>()

    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue
      used.add(i)

      const chain: Point[] = [segments[i]!.p1, segments[i]!.p2]
      let expanded = true

      while (expanded) {
        expanded = false
        const head = chain[0]!
        const tail = chain[chain.length - 1]!

        // If the chain is already closed, stop expanding
        if (chain.length >= 3 && pointsMatch(head, tail)) {
          break
        }

        for (let j = 0; j < segments.length; j++) {
          if (used.has(j)) continue
          const seg = segments[j]!

          if (pointsMatch(tail, seg.p1)) {
            chain.push(seg.p2)
            used.add(j)
            expanded = true
            break
          }
          if (pointsMatch(tail, seg.p2)) {
            chain.push(seg.p1)
            used.add(j)
            expanded = true
            break
          }
          if (pointsMatch(head, seg.p2)) {
            chain.unshift(seg.p1)
            used.add(j)
            expanded = true
            break
          }
          if (pointsMatch(head, seg.p1)) {
            chain.unshift(seg.p2)
            used.add(j)
            expanded = true
            break
          }
        }
      }

      // Check if chain closed
      if (chain.length >= 3) {
        if (pointsMatch(chain[0]!, chain[chain.length - 1]!)) {
          // Remove closing duplicate point for canonical polygon vertex list
          chain.pop()
        }
        if (chain.length >= 3) {
          const base = segments[i]!.original
          closedOutlines.push({
            ...base,
            outline: chain,
          })
        }
      }
    }

    result.push(...closedOutlines)
  }

  return result
}
