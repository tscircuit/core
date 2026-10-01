import type { FootprintLibraryResult } from "@tscircuit/props"
import { expect, test } from "bun:test"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  external0402Footprint,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("library footprint getters preserve the baseline second read and its diagnostic", async () => {
  const failure = new Error("footprint getter second read failed")
  const result = loadingRevisionDeferred<FootprintLibraryResult>()
  let resolverCalls = 0
  let footprintReads = 0
  const circuit = createLoadingRevisionCircuit({
    footprintLibraryMap: {
      kicad: () => {
        resolverCalls++
        return result.promise
      },
    },
  })
  try {
    circuit.add(
      <board>
        <resistor name="R1" resistance="10k" footprint="kicad:getter" />
      </board>,
    )
    const settled = circuit.renderUntilSettled()
    result.resolve({
      get footprintCircuitJson() {
        if (++footprintReads === 2) throw failure
        return external0402Footprint
      },
    })
    await settled
    const json = circuit.getCircuitJson()
    const diagnostics = json.filter(
      (element) => element.type === "external_footprint_load_error",
    )
    const pads = json.filter((element) => element.type === "pcb_smtpad")
    reportLoadingRevisionObservation(
      "library_getter_parity",
      "footprint_second_read",
      { resolverCalls, footprintReads, diagnostics, pads },
    )
    expect(resolverCalls).toBe(1)
    expect(footprintReads).toBe(2)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]!.footprinter_string).toBe("kicad:getter")
    expect(diagnostics[0]!.message.endsWith(`: ${failure.message}`)).toBe(true)
    expect(pads).toHaveLength(0)
  } finally {
    await disposeLoadingRevisionCircuit(circuit)
  }
})
