import { expect, test } from "bun:test"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  external0402Footprint,
  flushLoadingRevisionMicrotasks,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("H9 own props replacement preserves one footprint and ignores its abandoned resolver", async () => {
  const abandoned = loadingRevisionDeferred<{
    footprintCircuitJson: typeof external0402Footprint
  }>()
  const current = loadingRevisionDeferred<{
    footprintCircuitJson: typeof external0402Footprint
  }>()
  let calls = 0
  const circuit = createLoadingRevisionCircuit({
    footprintLibraryMap: {
      kicad: () => (++calls === 1 ? abandoned.promise : current.promise),
    },
  })
  let settled: Promise<void> | undefined
  try {
    circuit.add(
      <board>
        <resistor name="R1" resistance="10k" footprint="kicad:test" />
      </board>,
    )
    settled = circuit.renderUntilSettled()
    const resistor = circuit.selectOne(".R1")!
    resistor.setProps({ ...resistor.props, pcbX: 2 })
    await flushLoadingRevisionMicrotasks()
    current.resolve({ footprintCircuitJson: external0402Footprint })
    // Different old output makes accepting a stale generation publicly visible.
    abandoned.resolve({ footprintCircuitJson: [] })
    await settled
    const json = circuit.getCircuitJson()
    const pads = json.filter((element) => element.type === "pcb_smtpad")
    const diagnostics = json.filter(
      (element) => element.type === "external_footprint_load_error",
    )
    reportLoadingRevisionObservation("H9", "footprint_props", {
      calls,
      pads,
      diagnostics,
    })
    expect(calls).toBe(2)
    expect(pads).toHaveLength(2)
    expect(diagnostics).toHaveLength(0)
  } finally {
    abandoned.resolve({ footprintCircuitJson: [] })
    current.resolve({ footprintCircuitJson: external0402Footprint })
    await settled
    await disposeLoadingRevisionCircuit(circuit)
  }
})
