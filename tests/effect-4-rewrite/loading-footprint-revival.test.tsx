import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  external0402Footprint,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("explicitly revived footprint loaders restart only their interrupted generation", async () => {
  for (const removal of ["detach", "phase"] as const) {
    const abandoned = loadingDeferred<{
      footprintCircuitJson: typeof external0402Footprint
    }>()
    const current = loadingDeferred<{
      footprintCircuitJson: typeof external0402Footprint
    }>()
    let calls = 0
    const circuit = createLoadingCircuit({
      footprintLibraryMap: {
        kicad: () => (++calls === 1 ? abandoned.promise : current.promise),
      },
    })
    try {
      circuit.add(
        <board>
          <resistor name="R1" resistance="10k" footprint="kicad:test" />
        </board>,
      )
      circuit.render()
      expect(calls).toBe(1)
      const resistor = circuit.selectOne(".R1")!
      const parent = resistor.parent!
      if (removal === "detach") parent.remove(resistor)
      else {
        resistor.shouldBeRemoved = true
        circuit.render()
      }
      resistor.shouldBeRemoved = false
      if (removal === "detach") parent.add(resistor)
      const settled = circuit.renderUntilSettled()
      await flushLoading()
      expect(calls).toBe(2)
      current.resolve({ footprintCircuitJson: external0402Footprint })
      await settled
      expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
      const footprintChildren = resistor.children.slice()
      const output = structuredClone(circuit.getCircuitJson())
      abandoned.resolve({ footprintCircuitJson: external0402Footprint })
      await flushLoading()
      expect(resistor.children).toEqual(footprintChildren)
      expect(circuit.getCircuitJson()).toEqual(output)
      // Reattaching a completed component keeps its existing footprint children.
      parent.remove(resistor)
      resistor.shouldBeRemoved = false
      parent.add(resistor)
      await circuit.renderUntilSettled()
      expect(calls).toBe(2)
      expect(resistor.children).toEqual(footprintChildren)
      expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
      expect(circuit.effectRuntime.activeJobCount).toBe(0)
    } finally {
      await circuit.dispose()
    }
  }
})
