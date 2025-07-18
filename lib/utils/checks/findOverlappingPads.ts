import type { AnyCircuitElement } from "circuit-json"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/public-exports"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"

export interface PadOverlap {
  pad1: string
  pad2: string
}

/**
 * Detect overlapping PCB pads. Returns list of overlapping pairs.
 */
export function findOverlappingPads(
  dbOrSoup: CircuitJsonUtilObjects | AnyCircuitElement[],
): PadOverlap[] {
  const soup = Array.isArray(dbOrSoup) ? dbOrSoup : dbOrSoup.toArray()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: soup,
  })

  const padObstacles = simpleRouteJson.obstacles.filter((o) =>
    o.connectedTo.some(
      (id) => id.startsWith("pcb_smtpad") || id.startsWith("pcb_plated_hole"),
    ),
  )

  const overlaps: PadOverlap[] = []
  for (let i = 0; i < padObstacles.length; i++) {
    const a = padObstacles[i]
    for (let j = i + 1; j < padObstacles.length; j++) {
      const b = padObstacles[j]
      const { distance } = computeDistanceBetweenBoxes(
        {
          center: a.center,
          width: a.width,
          height: a.height,
        },
        {
          center: b.center,
          width: b.width,
          height: b.height,
        },
      )
      if (distance === 0) {
        const pad1 =
          a.connectedTo.find(
            (id) =>
              id.startsWith("pcb_smtpad") || id.startsWith("pcb_plated_hole"),
          ) || ""
        const pad2 =
          b.connectedTo.find(
            (id) =>
              id.startsWith("pcb_smtpad") || id.startsWith("pcb_plated_hole"),
          ) || ""
        overlaps.push({ pad1, pad2 })
      }
    }
  }
  return overlaps
}
