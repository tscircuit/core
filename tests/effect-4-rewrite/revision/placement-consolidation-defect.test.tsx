import { expect, spyOn, test } from "bun:test"
import * as checks from "@tscircuit/checks"
import { Circuit } from "lib/RootCircuit"
import {
  convergenceDeferred,
  disposeConvergenceCircuit,
} from "./shared-convergence-fixture"

test("H6 external-checks double: a consolidation defect reaches the placement failure diagnostic", async () => {
  const cause = new Error("controlled overlap consolidation defect")
  const placement =
    convergenceDeferred<Awaited<ReturnType<typeof checks.runAllPlacementChecks>>>()
  const requested = convergenceDeferred<void>()
  const originalConsolidation = checks.consolidatePcbOverlapErrors
  let consolidationCalls = 0
  const consolidationSpy = spyOn(
    checks,
    "consolidatePcbOverlapErrors",
  ).mockImplementation((...args) => {
    // The first call is inside the pre-route placement recorder. Later board
    // checks keep their real consolidation kernel and its separate coverage.
    if (++consolidationCalls === 1) throw cause
    return originalConsolidation(...args)
  })
  const check = () => {
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
        width={12}
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
    placement.resolve([])
    await settling
    const placementFailures = circuit
      .getCircuitJson()
      .filter((element) => element.type === "pcb_autorouting_error")
    expect(consolidationCalls).toBeGreaterThan(0)
    expect(placementFailures).toHaveLength(1)
    expect(placementFailures[0]?.message).toContain(cause.message)
  } finally {
    placement.resolve([])
    await settling?.catch(() => {})
    try {
      await disposeConvergenceCircuit(circuit)
    } finally {
      adapterSpy?.mockRestore()
      checksSpy.mockRestore()
      consolidationSpy.mockRestore()
    }
  }
})
