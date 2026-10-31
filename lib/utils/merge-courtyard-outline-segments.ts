import type { AnyCircuitElement } from "circuit-json"

type Point = { x: number; y: number }

const EPSILON = 1e-6

const isSamePoint = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON

/**
 * Some footprints (e.g. KiCad) draw the courtyard as separate line segments,
 * which are imported as two-point courtyard outlines. A courtyard outline needs
 * at least three points to enclose an area, so chain segments that share
 * endpoints into one outline and drop any outline that still can't enclose an
 * area.
 */
export const mergeCourtyardOutlineSegments = (
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const result: AnyCircuitElement[] = []
  const chainsByGroup = new Map<
    string,
    { element: AnyCircuitElement & { outline: Point[] }; points: Point[] }[]
  >()

  for (const elm of circuitJson) {
    if (elm.type !== "pcb_courtyard_outline" || elm.outline.length >= 3) {
      result.push(elm)
      continue
    }
    if (elm.outline.length < 2) continue

    const groupKey = `${elm.pcb_component_id}:${elm.layer}`
    const chains = chainsByGroup.get(groupKey) ?? []
    chainsByGroup.set(groupKey, chains)
    chains.push({ element: elm, points: [...elm.outline] })
  }

  for (const chains of chainsByGroup.values()) {
    let merged = true
    while (merged) {
      merged = false
      for (let i = 0; i < chains.length && !merged; i++) {
        for (let j = i + 1; j < chains.length && !merged; j++) {
          const a = chains[i].points
          const b = chains[j].points
          let joined: Point[] | null = null
          if (isSamePoint(a[a.length - 1], b[0])) {
            joined = [...a, ...b.slice(1)]
          } else if (isSamePoint(a[a.length - 1], b[b.length - 1])) {
            joined = [...a, ...[...b].reverse().slice(1)]
          } else if (isSamePoint(a[0], b[b.length - 1])) {
            joined = [...b, ...a.slice(1)]
          } else if (isSamePoint(a[0], b[0])) {
            joined = [...[...b].reverse(), ...a.slice(1)]
          }
          if (joined) {
            chains[i].points = joined
            chains.splice(j, 1)
            merged = true
          }
        }
      }
    }

    for (const { element, points } of chains) {
      // Drop the repeated start point of a closed chain
      if (
        points.length > 1 &&
        isSamePoint(points[0], points[points.length - 1])
      ) {
        points.pop()
      }
      if (points.length < 3) continue
      result.push({ ...element, outline: points })
    }
  }

  return result
}
