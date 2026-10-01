import type { SupplierPartNumbers } from "@tscircuit/props"
import { expect, test } from "bun:test"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  loadingRevisionDeferred,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("primitive supplier rejections keep the existing head's diagnostic formatting", async () => {
  for (const failure of ["offline", undefined]) {
    const result = loadingRevisionDeferred<SupplierPartNumbers>()
    const circuit = createLoadingRevisionCircuit({
      partsEngine: { findPart: () => result.promise },
    })
    try {
      circuit.add(
        <board>
          <resistor name="R1" resistance="10k" footprint="0402" />
        </board>,
      )
      const settled = circuit.renderUntilSettled()
      result.reject(failure)
      await settled
      const diagnostics = circuit
        .getCircuitJson()
        .filter((element) => element.type === "source_part_not_found_warning")
      reportLoadingRevisionObservation(
        "head_primitive_supplier_formatting",
        String(failure),
        diagnostics,
      )
      expect(diagnostics).toHaveLength(1)
      expect(diagnostics[0]!.message.endsWith(`: ${String(failure)}`)).toBe(
        true,
      )
    } finally {
      await disposeLoadingRevisionCircuit(circuit)
    }
  }
})
