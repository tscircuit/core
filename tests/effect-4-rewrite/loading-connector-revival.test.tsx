import { expect, test } from "bun:test"
import type { SupplierPartNumbers } from "@tscircuit/props"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
  loadingSupplierPads,
} from "./loading-fixture"

test("explicit connector revival replaces an interrupted lookup without accepting old output", async () => {
  const abandoned = loadingDeferred<SupplierPartNumbers>()
  const current = loadingDeferred<SupplierPartNumbers>()
  let findCalls = 0
  const fetchedParts: Array<string | undefined> = []
  const circuit = createLoadingCircuit({
    enablePartOrientationAnalysis: false,
    partsEngine: {
      findPart: () => (++findCalls === 1 ? abandoned.promise : current.promise),
      fetchPartCircuitJson: ({ supplierPartNumber }) => {
        fetchedParts.push(supplierPartNumber)
        return loadingSupplierPads
      },
    },
  })
  try {
    circuit.add(
      <board>
        <connector name="J1" standard="jst_ph" pinCount={2} />
      </board>,
    )
    circuit.render()
    const connector = circuit.selectOne(".J1")!
    const parent = connector.parent!
    parent.remove(connector)
    connector.shouldBeRemoved = false
    parent.add(connector)
    const settled = circuit.renderUntilSettled()
    await flushLoading()
    expect(findCalls).toBe(2)
    current.resolve({ jlcpcb: ["live"] })
    await settled
    abandoned.resolve({ jlcpcb: ["stale"] })
    await flushLoading()
    expect(fetchedParts).toEqual(["live"])
    expect(
      circuit.db.source_component.list()[0]?.supplier_part_numbers,
    ).toEqual({ jlcpcb: ["live"] })
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
    expect(circuit.effectRuntime.activeJobCount).toBe(0)
  } finally {
    await circuit.dispose()
  }
})
