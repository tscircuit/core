import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
  loadingSupplierPads,
} from "./loading-fixture"

test("late standard connector part data cannot attach a footprint or CAD model after removal", async () => {
  const part = loadingDeferred<AnyCircuitElement[]>()
  let fetchCalls = 0
  const circuit = createLoadingCircuit({
    partsEngine: {
      findPart: () => ({ jlcpcb: ["connector"] }),
      fetchPartCircuitJson: () => {
        fetchCalls++
        return part.promise
      },
    },
  })
  circuit.add(
    <board>
      <connector name="J1" standard="jst_ph" pinCount={2} />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  await flushLoading()
  expect(fetchCalls).toBe(1)
  const connector = circuit.selectOne(".J1")!
  const childrenBefore = connector.children.length
  connector.parent!.remove(connector)
  await settled
  part.resolve(loadingSupplierPads)
  await flushLoading()
  expect(connector.children).toHaveLength(childrenBefore)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(0)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
