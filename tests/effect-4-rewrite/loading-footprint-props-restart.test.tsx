import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  external0402Footprint,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("a prop update restarts a pending footprint once without reloading an already completed footprint", async () => {
  const abandoned = loadingDeferred<{
    footprintCircuitJson: typeof external0402Footprint
  }>()
  const current = loadingDeferred<{
    footprintCircuitJson: typeof external0402Footprint
  }>()
  let libraryCalls = 0
  const circuit = createLoadingCircuit({
    footprintLibraryMap: {
      kicad: () => (++libraryCalls === 1 ? abandoned.promise : current.promise),
    },
  })
  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="kicad:test" />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  const resistor = circuit.selectOne(".R1")!
  resistor.setProps({ ...resistor.props, pcbX: 1 })
  await flushLoading()
  expect(libraryCalls).toBe(2)
  current.resolve({ footprintCircuitJson: external0402Footprint })
  await settled
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  abandoned.resolve({ footprintCircuitJson: external0402Footprint })
  await flushLoading()
  resistor.setProps({ ...resistor.props, pcbX: 2 })
  await circuit.renderUntilSettled()
  expect(libraryCalls).toBe(2)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
