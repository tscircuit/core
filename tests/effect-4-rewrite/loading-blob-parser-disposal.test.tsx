import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  external0402Footprint,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("disposing a circuit suppresses late blob parser children", async () => {
  const parsed = loadingDeferred<{
    footprintCircuitJson: typeof external0402Footprint
  }>()
  const circuit = createLoadingCircuit({
    footprintFileParserMap: {
      kicad_mod: { loadFromUrl: () => parsed.promise },
    },
  })
  circuit.add(
    <board>
      <chip name="U1" footprint="blob:local/part.kicad_mod" />
    </board>,
  )
  circuit.render()
  const chip = circuit.selectOne(".U1")!
  const originalChildren = chip.children.length
  expect(circuit.effectRuntime.activeJobCount).toBe(1)
  await circuit.dispose()
  parsed.resolve({ footprintCircuitJson: external0402Footprint })
  await flushLoading()
  expect(chip.children).toHaveLength(originalChildren)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
})
