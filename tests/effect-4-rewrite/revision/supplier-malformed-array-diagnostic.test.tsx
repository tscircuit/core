import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("supplier malformed-array defects retain the public supplier failure diagnostic", async () => {
  const failure = new Error("supplier array length unavailable")
  const supplierResult = loadingRevisionDeferred<AnyCircuitElement[]>()
  let calls = 0
  const circuit = createLoadingRevisionCircuit({
    partsEngine: {
      findPart: () => ({}),
      fetchPartCircuitJson: () => {
        calls++
        return supplierResult.promise
      },
    },
  })
  try {
    circuit.add(
      <board>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          supplierPartNumbers={{ jlcpcb: ["malformed"] }}
        />
      </board>,
    )
    const settled = circuit.renderUntilSettled()
    supplierResult.resolve(
      new Proxy([] as AnyCircuitElement[], {
        get(target, property, receiver) {
          if (property === "length") throw failure
          return Reflect.get(target, property, receiver)
        },
      }),
    )
    await settled
    const json = circuit.getCircuitJson()
    const diagnostics = json.filter(
      (element) => element.type === "source_part_not_found_warning",
    )
    // This tests a public malformed callback, not the private IoU kernel.
    reportLoadingRevisionObservation(
      "supplier_diagnostic_guard",
      "array_length_defect",
      diagnostics,
    )
    expect(calls).toBe(1)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]!.supplier_name).toBe("jlcpcb")
    expect(diagnostics[0]!.supplier_part_number).toBe("malformed")
    expect(diagnostics[0]!.message).toContain(failure.message)
    expect(
      json.filter(
        (element) => element.type === "supplier_footprint_mismatch_warning",
      ),
    ).toHaveLength(0)
  } finally {
    supplierResult.resolve([])
    await disposeLoadingRevisionCircuit(circuit)
  }
})
