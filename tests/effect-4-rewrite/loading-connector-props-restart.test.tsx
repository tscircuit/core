import { expect, test } from "bun:test"
import type { SupplierPartNumbers } from "@tscircuit/props"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
  loadingSupplierPads,
} from "./loading-fixture"

test("standard connector replacement restarts supplier lookup and cannot fetch stale part generations", async () => {
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
  circuit.add(
    <board>
      <connector name="J1" standard="jst_ph" pinCount={2} />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  const connector = circuit.selectOne(".J1")!
  connector.setProps({ ...connector.props, pcbX: 1 })
  await flushLoading()
  expect(findCalls).toBe(2)
  current.resolve({ jlcpcb: ["current"] })
  await settled
  abandoned.resolve({ jlcpcb: ["stale"] })
  await flushLoading()
  expect(fetchedParts).toEqual(["current"])
  expect(circuit.db.source_component.list()[0]?.supplier_part_numbers).toEqual({
    jlcpcb: ["current"],
  })
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
