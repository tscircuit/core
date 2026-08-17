import { dedupePcbDrcErrors, runAllRoutingChecks } from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import type { Group } from "./Group"

export const Group_doInitialStandaloneSubcircuitPcbDesignRuleChecks = (
  group: Group<any>,
): void => {
  const isRootSubcircuit = group.root?.firstChild === group
  if (!group.isSubcircuit || !isRootSubcircuit || group._getBoard()) return

  const routingDisabled =
    group.root?.pcbRoutingDisabled ||
    group.getInheritedProperty("routingDisabled")
  const drcChecksDisabled =
    group.root?.platform?.drcChecksDisabled ??
    group.getInheritedProperty("drcChecksDisabled")
  const routingDrcChecksDisabled =
    group.root?.platform?.routingDrcChecksDisabled ??
    group.getInheritedProperty("routingDrcChecksDisabled")

  if (
    group.root?.pcbDisabled ||
    routingDisabled ||
    drcChecksDisabled ||
    routingDrcChecksDisabled
  ) {
    return
  }

  if (group._hasIncompleteAsyncEffectsInSubtreeForPhase("PcbTraceRender")) {
    return
  }
  if (group._hasTracesToRoute() && !group._areChildSubcircuitsRouted()) return
  if (
    group._standaloneSubcircuitDrcChecksComplete ||
    group._standaloneSubcircuitDrcChecksInProgress
  ) {
    return
  }

  const { db } = group.root!
  const subcircuitCircuitJson = db
    .subtree({ subcircuit_id: group.subcircuit_id })
    .toArray()

  group._standaloneSubcircuitDrcChecksInProgress = true
  group._queueAsyncEffect(
    "standalone-subcircuit:routing-drc-checks",
    async () => {
      try {
        const results = (await runAllRoutingChecks(
          subcircuitCircuitJson,
        )) as AnyCircuitElement[]
        db.insertAll(dedupePcbDrcErrors(results))
        group._standaloneSubcircuitDrcChecksComplete = true
      } finally {
        group._standaloneSubcircuitDrcChecksInProgress = false
      }
    },
  )
}
