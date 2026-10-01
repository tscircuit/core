import {
  dedupePcbDrcErrors,
  consolidatePcbOverlapErrors,
} from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import { coreSync } from "lib/effect/core-error"
import {
  DesignRuleChecks,
  defaultDesignRuleChecks,
  runDesignRuleCheckGroups,
  type DesignRuleCheckGroup,
} from "lib/effect/design-rule-checks"
import type { CoreJobContext } from "lib/effect/core-services"
import type { DrcCheck } from "../../primitive-components/DrcCheck"
import type { Board } from "./Board"

export const Board_updatePcbDesignRuleChecks = (board: Board) => {
  const { db } = board.root!

  const routingDisabled =
    board.root?.pcbRoutingDisabled ||
    board.getInheritedProperty("routingDisabled")
  const pcbDisabled = board.root?.pcbDisabled
  const schematicDisabled = board.root?.schematicDisabled

  const drcChecksDisabled =
    board.root?.platform?.drcChecksDisabled ??
    board.getInheritedProperty("drcChecksDisabled")

  // Disabled DRC needs neither a database snapshot nor an async effect. An
  // empty async effect would force another traversal of every render phase.
  if (drcChecksDisabled) {
    board._drcChecksComplete = true
    return
  }

  const netlistDrcChecksDisabled =
    board.root?.platform?.netlistDrcChecksDisabled ??
    board.getInheritedProperty("netlistDrcChecksDisabled")
  const pinSpecificationDrcChecksDisabled = board.getInheritedProperty(
    "pinSpecificationDrcChecksDisabled",
  )
  const placementDrcChecksDisabled =
    board.root?.platform?.placementDrcChecksDisabled ??
    board.getInheritedProperty("placementDrcChecksDisabled")
  const routingDrcChecksDisabled =
    board.root?.platform?.routingDrcChecksDisabled ??
    board.getInheritedProperty("routingDrcChecksDisabled")

  const shouldRunNetlistChecks = !drcChecksDisabled && !netlistDrcChecksDisabled
  const shouldRunPinSpecificationChecks =
    !drcChecksDisabled && !pinSpecificationDrcChecksDisabled
  const shouldRunSchematicChecks = !drcChecksDisabled && !schematicDisabled
  const shouldRunPlacementChecks =
    !drcChecksDisabled && !pcbDisabled && !placementDrcChecksDisabled
  const shouldRunRoutingChecks =
    !drcChecksDisabled &&
    !pcbDisabled &&
    !routingDisabled &&
    !routingDrcChecksDisabled

  const fabricatorEngine = board.root?.platform?.fabricatorEngine
  const fabricatorPreset = board._parsedProps.fabricatorPreset
  const shouldRunFabricatorChecks =
    !drcChecksDisabled &&
    !pcbDisabled &&
    !!fabricatorEngine &&
    !!fabricatorPreset

  // If async trace routing is still in progress anywhere in this board subtree,
  // wait so routing DRC sees final routed traces and doesn't mark DRC complete early.
  if (
    (shouldRunRoutingChecks || shouldRunFabricatorChecks) &&
    board._hasIncompleteAsyncEffectsInSubtreeForPhase("PcbTraceRender")
  )
    return

  // Routing checks should only wait for child subcircuits when there are
  // traces that actually need routing. Otherwise placement/netlist DRC can run.
  const hasTracesToRoute = board._hasTracesToRoute()
  if (
    (shouldRunRoutingChecks || shouldRunFabricatorChecks) &&
    hasTracesToRoute &&
    !board._areChildSubcircuitsRouted()
  )
    return

  // Only run once after all configured checks are complete.
  if (board._drcChecksComplete || board._drcChecksInProgress) return

  const runDrcChecks = (
    circuitJson: AnyCircuitElement[],
    job: CoreJobContext,
  ) =>
    Effect.gen(function* () {
      const {
        runAllNetlistChecks,
        runAllPinSpecificationChecks,
        runAllPlacementChecks,
        runAllRoutingChecks,
        runAllSchematicChecks,
      } = yield* DesignRuleChecks
      const checksToRun: DesignRuleCheckGroup[] = []
      // Defer invocation so synchronous throws and promise rejections follow the
      // same path. A failed group must not discard diagnostics from other groups.
      const queueCheck = (
        checkName: string,
        check: () => AnyCircuitElement[] | Promise<AnyCircuitElement[]>,
      ) => {
        checksToRun.push({ name: checkName, check })
      }

      const pcbBoardId = board.pcb_board_id
      if (
        shouldRunFabricatorChecks &&
        fabricatorEngine &&
        fabricatorPreset &&
        pcbBoardId
      ) {
        queueCheck("fabricator", () =>
          fabricatorEngine.runDrcChecks({
            circuitJson,
            fabricatorPreset,
            pcbBoardId,
          }),
        )
      }

      if (shouldRunRoutingChecks) {
        queueCheck(
          "routing",
          () =>
            runAllRoutingChecks(circuitJson).then((results) =>
              results.filter(
                (result) => !board._isExpectedCastellatedHoleDrcError(result),
              ),
            ) as Promise<AnyCircuitElement[]>,
        )
      }

      if (shouldRunPlacementChecks) {
        const existingPlacementDiagnostics = db.toArray()
        queueCheck(
          "placement",
          () =>
            runAllPlacementChecks(circuitJson, {
              consolidateOverlaps: false,
            }).then((results) =>
              consolidatePcbOverlapErrors(
                circuitJson,
                results.filter(
                  (result) => !board._isExpectedCastellatedHoleDrcError(result),
                ),
              ).filter(
                (result) =>
                  !existingPlacementDiagnostics.some(
                    (existing) =>
                      existing.type === result.type &&
                      "message" in existing &&
                      existing.message === result.message,
                  ),
              ),
            ) as Promise<AnyCircuitElement[]>,
        )
      }

      if (shouldRunNetlistChecks) {
        queueCheck(
          "netlist",
          () =>
            runAllNetlistChecks(circuitJson) as Promise<AnyCircuitElement[]>,
        )
      }

      if (shouldRunPinSpecificationChecks) {
        queueCheck(
          "pin_specification",
          () =>
            runAllPinSpecificationChecks(circuitJson) as Promise<
              AnyCircuitElement[]
            >,
        )
      }

      if (shouldRunSchematicChecks) {
        queueCheck(
          "schematic",
          () =>
            runAllSchematicChecks(circuitJson) as Promise<AnyCircuitElement[]>,
        )
      }

      if (!drcChecksDisabled) {
        for (const drcCheck of board.selectAll<DrcCheck>("drccheck")) {
          const checkerRoot = drcCheck.root
          const isCheckerCurrent = () =>
            job.isCurrent() &&
            !drcCheck.shouldBeRemoved &&
            drcCheck.root === checkerRoot
          checksToRun.push({
            name: drcCheck.getString(),
            program: drcCheck.runCustomDrcCheckEffect(circuitJson).pipe(
              Effect.map((diagnostics) =>
                isCheckerCurrent() ? diagnostics : [],
              ),
              Effect.catch((error) =>
                isCheckerCurrent()
                  ? Effect.fail(error)
                  : Effect.succeed([] as AnyCircuitElement[]),
              ),
            ),
          })
        }
      }

      const checkResults = yield* runDesignRuleCheckGroups({
        groups: checksToRun,
        onFailure: (checkGroup, error) =>
          job.commit(() => {
            const cause = error instanceof Error ? error.message : String(error)
            db.source_runtime_error.insert({
              error_type: "source_runtime_error",
              phase_name: "PcbDesignRuleChecks",
              message: `DRC could not complete (${checkGroup.name}): ${cause}`,
            })
          }),
      })
      yield* coreSync(
        () =>
          job.commit(() =>
            db.insertAll(
              consolidatePcbOverlapErrors(
                circuitJson,
                dedupePcbDrcErrors(checkResults),
              ),
            ),
          ),
        "drc:commit-results",
      )
    })

  const subcircuit = db.subtree({ subcircuit_id: board.subcircuit_id })
  const subcircuitCircuitJson = subcircuit.toArray()

  board._drcChecksInProgress = true
  board._queueEffect("board:drc-checks", (job) =>
    Effect.gen(function* () {
      yield* runDrcChecks(subcircuitCircuitJson, job)
      yield* coreSync(
        () =>
          job.commit(() => {
            board._drcChecksComplete = true
          }),
        "drc:complete",
      )
    }).pipe(
      Effect.provideService(DesignRuleChecks, defaultDesignRuleChecks),
      Effect.ensuring(
        Effect.sync(() => {
          board._drcChecksInProgress = false
        }),
      ),
    ),
  )
}
