import { runAllPlacementChecks } from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import type { ZodType } from "zod"
import type { Renderable } from "../../base-components/Renderable"
import type { Group } from "./Group"

const resetPcbTraceRenderInSubtree = (renderable: Renderable) => {
  if (renderable._pcbTraceRenderWaitingForPlacementChecks) {
    renderable.renderPhaseStates.PcbTraceRender.initialized = false
    renderable.renderPhaseStates.PcbTraceRender.dirty = false
    renderable._pcbTraceRenderWaitingForPlacementChecks = false
  }
  for (const child of renderable.children) {
    resetPcbTraceRenderInSubtree(child as Renderable)
  }
}

export const Group_doInitialPcbPlacementDesignRuleChecks = <
  Props extends ZodType,
>(
  group: Group<Props>,
  effectName = "subcircuit:pre-route-placement-checks",
) => {
  if (group.root?.pcbDisabled) return

  const placementDrcChecksDisabled =
    group.root?.platform?.placementDrcChecksDisabled ??
    group.getInheritedProperty("placementDrcChecksDisabled")
  const drcChecksDisabled =
    group.root?.platform?.drcChecksDisabled ??
    group.getInheritedProperty("drcChecksDisabled")

  group._pcbPlacementDrcErrorCount = null
  group._pcbPlacementDrcCheckError = null
  group._pcbPlacementDrcChecksPending = false
  if (placementDrcChecksDisabled || drcChecksDisabled) {
    group._pcbPlacementDrcErrorCount = 0
    return
  }

  const { db } = group.root!
  const subcircuitCircuitJson = db
    .subtree({ subcircuit_id: group.subcircuit_id })
    .toArray()
  const existingPlacementDiagnostics = db.toArray()

  group._pcbPlacementDrcChecksPending = true
  group._queueAsyncEffect(effectName, async () => {
    try {
      const placementCheckResults = await runAllPlacementChecks(
        subcircuitCircuitJson,
      )
      const newPlacementDiagnostics = placementCheckResults.filter(
        (result) =>
          !existingPlacementDiagnostics.some(
            (existing) =>
              existing.type === result.type &&
              "message" in existing &&
              existing.message === result.message,
          ),
      )

      db.insertAll(newPlacementDiagnostics as AnyCircuitElement[])
      group._pcbPlacementDrcErrorCount = placementCheckResults.filter(
        (result) => result.type.endsWith("_error"),
      ).length
    } catch (error) {
      group._pcbPlacementDrcCheckError =
        error instanceof Error ? error.message : String(error)
    } finally {
      group._pcbPlacementDrcChecksPending = false
      resetPcbTraceRenderInSubtree(group)
    }
  })
}
