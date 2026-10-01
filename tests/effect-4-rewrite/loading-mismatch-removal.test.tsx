import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("late mismatch failures cannot insert supplier warnings after owner removal", async () => {
  const supplier = loadingDeferred<AnyCircuitElement[]>()
  let calls = 0
  const circuit = createLoadingCircuit({
    enablePartOrientationAnalysis: false,
    partsEngine: {
      findPart: () => ({}),
      fetchPartCircuitJson: () => {
        calls++
        return supplier.promise
      },
    },
  })
  circuit.add(
    <board>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["missing"] }}
      />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  expect(calls).toBe(1)
  const resistor = circuit.selectOne(".R1")!
  resistor.parent!.remove(resistor)
  await settled
  supplier.reject(new Error("late supplier failure"))
  await flushLoading()
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(0)
  expect(circuit.db.supplier_footprint_mismatch_warning.list()).toHaveLength(0)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
