import { consolidatePcbOverlapErrors } from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import { corePromise, coreSync } from "lib/effect/core-error"
import { catchJobFailure } from "lib/effect/job-failure"
import {
  DesignRuleChecks,
  defaultDesignRuleChecks,
} from "lib/effect/design-rule-checks"
import type { Renderable } from "../../base-components/Renderable"
import type { Board } from "./Board"

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

export const Board_doInitialPcbPlacementDesignRuleChecks = (board: Board) => {
  if (board.root?.pcbDisabled) return

  const placementDrcChecksDisabled =
    board.root?.platform?.placementDrcChecksDisabled ??
    board.getInheritedProperty("placementDrcChecksDisabled")
  const drcChecksDisabled =
    board.root?.platform?.drcChecksDisabled ??
    board.getInheritedProperty("drcChecksDisabled")

  board._pcbPlacementDrcErrorCount = null
  board._pcbPlacementDrcCheckError = null
  board._pcbPlacementDrcChecksPending = false
  if (placementDrcChecksDisabled || drcChecksDisabled) {
    board._pcbPlacementDrcErrorCount = 0
    return
  }

  const { db } = board.root!
  const subcircuitCircuitJson = db
    .subtree({ subcircuit_id: board.subcircuit_id })
    .toArray()
  const existingPlacementDiagnostics = db.toArray()

  board._pcbPlacementDrcChecksPending = true
  board._queueEffect(
    "board:pre-route-placement-checks",
    (job) =>
      Effect.gen(function* () {
        const { runAllPlacementChecks } = yield* DesignRuleChecks
        const placementCheckResults = yield* corePromise(
          () =>
            runAllPlacementChecks(subcircuitCircuitJson, {
              consolidateOverlaps: false,
            }),
          "drc:placement",
        )
        const relevantPlacementCheckResults = consolidatePcbOverlapErrors(
          subcircuitCircuitJson,
          placementCheckResults.filter(
            (result) => !board._isExpectedCastellatedHoleDrcError(result),
          ),
        )
        const newPlacementDiagnostics = relevantPlacementCheckResults.filter(
          (result) =>
            !existingPlacementDiagnostics.some(
              (existing) =>
                existing.type === result.type &&
                "message" in existing &&
                existing.message === result.message,
            ),
        )

        yield* coreSync(
          () =>
            job.commit(() => {
              db.insertAll(newPlacementDiagnostics as AnyCircuitElement[])
              board._pcbPlacementDrcErrorCount =
                relevantPlacementCheckResults.filter((result) =>
                  result.type.endsWith("_error"),
                ).length
            }),
          "drc:commit-placement",
        )
      }).pipe(
        Effect.provideService(DesignRuleChecks, defaultDesignRuleChecks),
        (program) =>
          catchJobFailure(program, (cause) =>
            coreSync(
              () =>
                job.commit(() => {
                  board._pcbPlacementDrcCheckError =
                    cause instanceof Error ? cause.message : String(cause)
                }),
              "drc:placement-failure",
            ),
          ),
        Effect.ensuring(
          Effect.sync(() => {
            board._pcbPlacementDrcChecksPending = false
            if (
              job.cancellationReason !== "disposed" &&
              job.cancellationReason !== "removed"
            ) {
              resetPcbTraceRenderInSubtree(board)
            }
          }),
        ),
        Effect.asVoid,
      ),
    { propsChange: "finish" },
  )
}
