import type { FootprintLibraryResult } from "@tscircuit/props"
import { expect, test } from "bun:test"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("H5 malformed library results retain the baseline structured footprint diagnostic", async () => {
  const observations = []
  for (const malformed of [
    { scenario: "null", value: null },
    { scenario: "undefined", value: undefined },
    { scenario: "empty_object", value: {} },
    { scenario: "string", value: "malformed" },
  ]) {
    const result = loadingRevisionDeferred<FootprintLibraryResult>()
    const terminalErrors: string[] = []
    let calls = 0
    const circuit = createLoadingRevisionCircuit({
      footprintLibraryMap: {
        kicad: () => {
          calls++
          return result.promise
        },
      },
    })
    try {
      circuit.on("asyncEffect:end", (event) => {
        if (event.effectName === "load-lib-footprint" && event.error)
          terminalErrors.push(event.error)
      })
      circuit.add(
        <board>
          <resistor name="R1" resistance="10k" footprint="kicad:malformed" />
        </board>,
      )
      const settled = circuit.renderUntilSettled()
      result.resolve(malformed.value as FootprintLibraryResult)
      await settled
      const json = circuit.getCircuitJson()
      const diagnostics = json.filter(
        (element) => element.type === "external_footprint_load_error",
      )
      const observation = {
        scenario: malformed.scenario,
        calls,
        diagnostics,
        terminalErrors,
        json,
      }
      observations.push(observation)
      // Root compares these actual messages against the baseline in the same runtime.
      reportLoadingRevisionObservation("H5", malformed.scenario, {
        diagnostics,
        terminalErrors,
      })
    } finally {
      await disposeLoadingRevisionCircuit(circuit)
    }
  }
  for (const observation of observations) {
    expect(observation.calls).toBe(1)
    expect(observation.diagnostics).toHaveLength(1)
    const diagnostic = observation.diagnostics[0]!
    expect(diagnostic.footprinter_string).toBe("kicad:malformed")
    expect(
      observation.json.some(
        (element) =>
          element.type === "source_component" &&
          element.source_component_id === diagnostic.source_component_id,
      ),
    ).toBe(true)
    expect(
      observation.json.some(
        (element) =>
          element.type === "pcb_component" &&
          element.pcb_component_id === diagnostic.pcb_component_id,
      ),
    ).toBe(true)
    expect(
      observation.json.filter((element) => element.type === "pcb_smtpad"),
    ).toHaveLength(0)
    expect(observation.terminalErrors).toHaveLength(1)
  }
})
