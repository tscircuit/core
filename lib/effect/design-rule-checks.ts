import {
  runAllNetlistChecks,
  runAllPinSpecificationChecks,
  runAllPlacementChecks,
  runAllRoutingChecks,
  runAllSchematicChecks,
} from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { corePromise, coreSync, type CoreError } from "./core-error"

export const defaultDesignRuleChecks = {
  runAllNetlistChecks,
  runAllPinSpecificationChecks,
  runAllPlacementChecks,
  runAllRoutingChecks,
  runAllSchematicChecks,
}

/** External check kernels are value-level adapters; ownership belongs to jobs. */
export class DesignRuleChecks extends Context.Service<
  DesignRuleChecks,
  typeof defaultDesignRuleChecks
>()("tscircuit/DesignRuleChecks") {}

interface DesignRuleCheckGroupName {
  readonly name: string
}

export type DesignRuleCheckGroup = DesignRuleCheckGroupName &
  (
    | {
        readonly check: () =>
          | AnyCircuitElement[]
          | PromiseLike<AnyCircuitElement[]>
      }
    | { readonly program: Effect.Effect<AnyCircuitElement[], CoreError> }
  )

/**
 * Preserve concurrent groups and their declaration-order results. A failed
 * group emits its diagnostic without cancelling unrelated successful checks.
 * Existing checker APIs have no AbortSignal/close contract: interruption stops
 * awaiting them, and the owning job guards every eventual database mutation.
 */
export function runDesignRuleCheckGroups({
  groups,
  onFailure,
}: {
  groups: readonly DesignRuleCheckGroup[]
  onFailure: (group: DesignRuleCheckGroup, cause: unknown) => void
}) {
  return Effect.all(
    groups.map((group) =>
      ("program" in group
        ? group.program
        : corePromise(
            () => Promise.resolve().then(group.check),
            `drc:${group.name}`,
          )
      ).pipe(
        Effect.catch((error: CoreError) =>
          coreSync(() => {
            onFailure(group, error.cause)
            return [] as AnyCircuitElement[]
          }, "drc:failure-diagnostic"),
        ),
      ),
    ),
    { concurrency: "unbounded" },
  ).pipe(Effect.map((results) => results.flat()))
}
