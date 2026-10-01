import { expect, spyOn, test } from "bun:test"
import * as checks from "@tscircuit/checks"
import type { PcbComponentMissingCourtyardWarning } from "circuit-json"
import { Circuit } from "lib/RootCircuit"
import {
  convergenceDeferred,
  disposeConvergenceCircuit,
} from "./shared-convergence-fixture"

type PlacementResults = Awaited<ReturnType<typeof checks.runAllPlacementChecks>>

const controlledWarning: PcbComponentMissingCourtyardWarning = {
  type: "pcb_component_missing_courtyard_warning",
  pcb_component_missing_courtyard_warning_id: "controlled_courtyard_warning",
  warning_type: "pcb_component_missing_courtyard_warning",
  pcb_component_id: "pcb_component_0",
  message: "Controlled placement warning",
}

/**
 * External-checks test double: there is no public placement-check callback.
 * Patch the exported checker and its Effect service adapter when present. The
 * baseline has only the checker; all observations below are public JSON.
 */
async function renderPlacementConvergence(changeBoard: boolean) {
  const placement = convergenceDeferred<PlacementResults>()
  const requested = convergenceDeferred<void>()
  let checkCalls = 0
  const check = () => {
    checkCalls++
    requested.resolve()
    return placement.promise
  }
  const checksSpy = spyOn(checks, "runAllPlacementChecks").mockImplementation(
    check,
  )
  const adapterUrl = new URL(
    "../../../lib/effect/design-rule-checks.ts",
    import.meta.url,
  )
  const adapter = (await Bun.file(adapterUrl).exists())
    ? await import("lib/effect/design-rule-checks")
    : undefined
  const adapterSpy = adapter
    ? spyOn(adapter.defaultDesignRuleChecks, "runAllPlacementChecks").mockImplementation(
        check,
      )
    : undefined
  const circuit = new Circuit({
    platform: {
      allowLegacyAutorouters: true,
      schematicDisabled: true,
      routingDrcChecksDisabled: true,
      netlistDrcChecksDisabled: true,
    },
  })
  let settling: Promise<void> | undefined
  try {
    circuit.add(
      <board
        width={changeBoard ? 10 : 12}
        height={8}
        autorouter="sequential-trace"
        pinSpecificationDrcChecksDisabled
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </board>,
    )
    settling = circuit.renderUntilSettled()
    void settling.catch(() => {})
    await requested.promise
    if (changeBoard) {
      const board = circuit._getBoard()!
      board.setProps({ ...board.props, width: 12 })
    }
    placement.resolve([controlledWarning])
    await settling
    const output = circuit.getCircuitJson().filter(
      (element) =>
        element.type === "pcb_trace" ||
        element.type === "pcb_autorouting_error" ||
        element.type === "source_runtime_error" ||
        (element.type === "pcb_component_missing_courtyard_warning" &&
          element.message === controlledWarning.message),
    )
    return { output, checkCalls }
  } finally {
    placement.resolve([controlledWarning])
    await settling?.catch(() => {})
    try {
      await disposeConvergenceCircuit(circuit)
    } finally {
      adapterSpy?.mockRestore()
      checksSpy.mockRestore()
    }
  }
}

test("H4 external-checks double: pending placement checks preserve traces and diagnostics after board props", async () => {
  const changed = await renderPlacementConvergence(true)
  const fresh = await renderPlacementConvergence(false)
  expect(fresh.output.filter((row) => row.type === "pcb_trace")).toHaveLength(1)
  expect(
    fresh.output.filter(
      (row) => row.type === "pcb_component_missing_courtyard_warning",
    ),
  ).toHaveLength(1)
  expect(changed.checkCalls).toBeGreaterThan(0)
  expect(changed.output).toEqual(fresh.output)
})
