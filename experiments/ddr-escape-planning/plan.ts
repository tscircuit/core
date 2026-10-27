/** Experimental placement proposal, not enabled by the production router.
 * Points are board-world XY millimetres, +X right, +Y up (right handed).
 * Offsets are directions: only explicitly movable component positions change.
 * The adapter must regenerate all physical geometry and check placement, vias,
 * opposite-side pads and fixed copper. A reservation is not a completed route.
 */
export interface Placement<ComponentId> {
  componentId: ComponentId
  x: number
  y: number
  movable: boolean
}
export interface EscapeAssessment<ComponentId> {
  placementValid: boolean
  escapedConnections: number
  requiredConnections: number
  jointlyFeasible: boolean
  blockedBy: ComponentId[]
}
export async function proposeEscapePlacement<ComponentId>(options: {
  placements: Placement<ComponentId>[]
  offsets: { x: number; y: number }[]
  maxDisplacementMm: number
  maxEvaluations: number
  assess: (
    placements: Placement<ComponentId>[],
  ) => Promise<EscapeAssessment<ComponentId>>
}) {
  if (
    !Number.isFinite(options.maxDisplacementMm) ||
    options.maxDisplacementMm < 0 ||
    !Number.isInteger(options.maxEvaluations) ||
    options.maxEvaluations < 1
  )
    throw new Error("Invalid escape-planning budget")
  const original = structuredClone(options.placements)
  let placements = structuredClone(original)
  let assessment = await options.assess(structuredClone(placements))
  let evaluations = 1
  const seen = new Set([JSON.stringify(placements)])
  while (!assessment.jointlyFeasible && evaluations < options.maxEvaluations) {
    let improvement:
      | {
          placements: typeof placements
          assessment: typeof assessment
          displacement: number
        }
      | undefined
    for (const blockedComponentId of assessment.blockedBy) {
      const index = original.findIndex(
        (p) => p.componentId === blockedComponentId,
      )
      if (index < 0 || !original[index].movable) continue
      for (const offset of options.offsets) {
        if (evaluations >= options.maxEvaluations) break
        const displacement = Math.hypot(offset.x, offset.y)
        if (
          !Number.isFinite(displacement) ||
          displacement > options.maxDisplacementMm
        )
          continue
        const candidate = structuredClone(placements)
        candidate[index].x = original[index].x + offset.x
        candidate[index].y = original[index].y + offset.y
        const key = JSON.stringify(candidate)
        if (seen.has(key)) continue
        seen.add(key)
        const result = await options.assess(structuredClone(candidate))
        evaluations++
        if (
          !result.placementValid ||
          result.requiredConnections !== assessment.requiredConnections
        )
          continue
        const better =
          result.escapedConnections > assessment.escapedConnections ||
          result.jointlyFeasible
        if (
          better &&
          (!improvement ||
            Number(result.jointlyFeasible) >
              Number(improvement.assessment.jointlyFeasible) ||
            (result.jointlyFeasible ===
              improvement.assessment.jointlyFeasible &&
              (result.escapedConnections >
                improvement.assessment.escapedConnections ||
                (result.escapedConnections ===
                  improvement.assessment.escapedConnections &&
                  displacement < improvement.displacement))))
        )
          improvement = {
            placements: candidate,
            assessment: result,
            displacement,
          }
      }
    }
    if (!improvement) break
    placements = improvement.placements
    assessment = improvement.assessment
  }
  const feasible =
    assessment.placementValid &&
    assessment.jointlyFeasible &&
    assessment.escapedConnections === assessment.requiredConnections
  return {
    status: feasible ? ("escape_feasible" as const) : ("blocked" as const),
    evaluations,
    placements,
    assessment,
    changes: placements.flatMap((p, i) =>
      p.x === original[i].x && p.y === original[i].y
        ? []
        : [
            {
              componentId: p.componentId,
              from: { x: original[i].x, y: original[i].y },
              to: { x: p.x, y: p.y },
            },
          ],
    ),
  }
}
