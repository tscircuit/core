import type { AnyCircuitElement } from "circuit-json"
import { repositionSchematicComponentTo } from "@tscircuit/circuit-json-util"
import {
  detectSchematicCollisions,
  type CollisionPair,
} from "./detectSchematicCollisions"

const DIRECTIONS = [
  { dx: 0, dy: 1 },
  { dx: 1, dy: 1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: -1 },
  { dx: 0, dy: -1 },
  { dx: -1, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: 1 },
]
const STEP_SIZES = [0.5, 1.0, 2.0, 4.0]
const MAX_ITERATIONS = 10

function getComponentCenter(
  circuitJson: AnyCircuitElement[],
  schematic_component_id: string,
): { x: number; y: number } | null {
  const el = circuitJson.find(
    (e) =>
      e.type === "schematic_component" &&
      (e as any).schematic_component_id === schematic_component_id,
  ) as any
  return el?.center ?? null
}

function scorePosition(
  circuitJson: AnyCircuitElement[],
  schematic_component_id: string,
  candidateCenter: { x: number; y: number },
  originalCenter: { x: number; y: number },
): number {
  // Temporarily build a patched circuit json array for scoring
  const patched = circuitJson.map((el) => {
    if (
      el.type !== "schematic_component" &&
      el.type !== "schematic_text" &&
      el.type !== "schematic_port"
    )
      return el

    const anyEl = el as any
    if (anyEl.schematic_component_id !== schematic_component_id) return el

    if (el.type === "schematic_component") {
      return { ...el, center: candidateCenter }
    }

    if (el.type === "schematic_text") {
      const dx = candidateCenter.x - originalCenter.x
      const dy = candidateCenter.y - originalCenter.y
      return {
        ...el,
        position: {
          x: anyEl.position.x + dx,
          y: anyEl.position.y + dy,
        },
      }
    }

    if (el.type === "schematic_port") {
      const dx = candidateCenter.x - originalCenter.x
      const dy = candidateCenter.y - originalCenter.y
      return {
        ...el,
        center: {
          x: anyEl.center.x + dx,
          y: anyEl.center.y + dy,
        },
      }
    }

    return el
  })

  const collisions = detectSchematicCollisions(patched)

  // filter collisions involving this component or its texts
  const relevant = collisions.filter(
    (c) =>
      (c.a.type === "schematic_component" && c.a.id === schematic_component_id) ||
      (c.b.type === "schematic_component" && c.b.id === schematic_component_id) ||
      (c.a.type === "schematic_text" &&
        c.a.parentComponentId === schematic_component_id) ||
      (c.b.type === "schematic_text" &&
        c.b.parentComponentId === schematic_component_id),
  )

  const totalOverlap = relevant.reduce((sum, c) => sum + c.overlapArea, 0)
  const dx = candidateCenter.x - originalCenter.x
  const dy = candidateCenter.y - originalCenter.y
  const distancePenalty = Math.sqrt(dx * dx + dy * dy) * 0.1

  return relevant.length * 1000 + totalOverlap + distancePenalty
}

function getComponentsWithCollisions(
  collisions: CollisionPair[],
): Map<string, number> {
  const scores = new Map<string, number>()
  for (const c of collisions) {
    if (c.a.type === "schematic_component") {
      scores.set(c.a.id, (scores.get(c.a.id) ?? 0) + c.overlapArea)
    }
    if (c.b.type === "schematic_component") {
      scores.set(c.b.id, (scores.get(c.b.id) ?? 0) + c.overlapArea)
    }
    if (c.a.type === "schematic_text" && c.a.parentComponentId) {
      scores.set(
        c.a.parentComponentId,
        (scores.get(c.a.parentComponentId) ?? 0) + c.overlapArea,
      )
    }
    if (c.b.type === "schematic_text" && c.b.parentComponentId) {
      scores.set(
        c.b.parentComponentId,
        (scores.get(c.b.parentComponentId) ?? 0) + c.overlapArea,
      )
    }
  }
  return scores
}

export function resolveSchematicCollisions(
  circuitJson: AnyCircuitElement[],
): void {
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const collisions = detectSchematicCollisions(circuitJson)
    if (collisions.length === 0) break

    const componentOverlapScores = getComponentsWithCollisions(collisions)
    if (componentOverlapScores.size === 0) break

    // sort by worst overlap first
    const sortedComponents = [...componentOverlapScores.entries()].sort(
      (a, b) => b[1] - a[1],
    )

    let anyMoved = false

    for (const [schematic_component_id] of sortedComponents) {
      const originalCenter = getComponentCenter(
        circuitJson,
        schematic_component_id,
      )
      if (!originalCenter) continue

      const currentScore = scorePosition(
        circuitJson,
        schematic_component_id,
        originalCenter,
        originalCenter,
      )
      if (currentScore === 0) continue

      let bestScore = currentScore
      let bestCenter = originalCenter

      for (const { dx, dy } of DIRECTIONS) {
        for (const step of STEP_SIZES) {
          const candidate = {
            x: originalCenter.x + dx * step,
            y: originalCenter.y + dy * step,
          }
          const score = scorePosition(
            circuitJson,
            schematic_component_id,
            candidate,
            originalCenter,
          )
          if (score < bestScore) {
            bestScore = score
            bestCenter = candidate
          }
        }
      }

      if (bestCenter !== originalCenter) {
        repositionSchematicComponentTo(
          circuitJson,
          schematic_component_id,
          bestCenter,
        )
        anyMoved = true
      }
    }

    if (!anyMoved) break
  }
}
