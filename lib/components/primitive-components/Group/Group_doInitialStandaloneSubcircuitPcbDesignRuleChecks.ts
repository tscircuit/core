import { dedupePcbDrcErrors } from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import { corePromise, coreSync } from "lib/effect/core-error"
import {
  DesignRuleChecks,
  defaultDesignRuleChecks,
} from "lib/effect/design-rule-checks"
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
  group._queueEffect(
    "standalone-subcircuit:routing-drc-checks",
    (job) =>
      Effect.gen(function* () {
        const { runAllRoutingChecks } = yield* DesignRuleChecks
        const results = (yield* corePromise(
          () => runAllRoutingChecks(subcircuitCircuitJson),
          "drc:standalone-routing",
        )) as AnyCircuitElement[]
        yield* coreSync(
          () =>
            job.commit(() => {
              db.insertAll(dedupePcbDrcErrors(results))
              group._standaloneSubcircuitDrcChecksComplete = true
            }),
          "drc:commit-standalone-routing",
        )
      }).pipe(
        Effect.provideService(DesignRuleChecks, defaultDesignRuleChecks),
        Effect.ensuring(
          Effect.sync(() => {
            group._standaloneSubcircuitDrcChecksInProgress = false
          }),
        ),
      ),
    // Preserve the baseline's captured routing-check snapshot across updates.
    { propsChange: "finish" },
  )
}
