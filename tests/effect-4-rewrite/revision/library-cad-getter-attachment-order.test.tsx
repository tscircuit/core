import type { FootprintLibraryResult } from "@tscircuit/props"
import { expect, test } from "bun:test"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  external0402Footprint,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("a failing library CAD getter preserves children attached before the baseline failure", async () => {
  const failure = new Error("library CAD getter failed")
  const result = loadingRevisionDeferred<FootprintLibraryResult>()
  let resolverCalls = 0
  let cadReads = 0
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
        <resistor name="R1" resistance="10k" footprint="kicad:cad_getter" />
      </board>,
    )
    const settled = circuit.renderUntilSettled()
    result.resolve({
      footprintCircuitJson: external0402Footprint,
      get cadModel(): never {
        cadReads++
        throw failure
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
      "cad_after_attachment",
      { resolverCalls, cadReads, diagnostics, pads },
    )
    expect(resolverCalls).toBe(1)
    expect(cadReads).toBe(1)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]!.footprinter_string).toBe("kicad:cad_getter")
    expect(diagnostics[0]!.message.endsWith(`: ${failure.message}`)).toBe(true)
    expect(pads).toHaveLength(2)
    expect(pads.map((pad) => pad.port_hints)).toEqual([["1"], ["2"]])
  } finally {
    await disposeLoadingRevisionCircuit(circuit)
  }
})
