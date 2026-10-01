import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  external0402Footprint,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("noncooperative library results and failures cannot attach after subtree removal", async () => {
  const first = loadingDeferred<typeof external0402Footprint>()
  const second = loadingDeferred<typeof external0402Footprint>()
  const circuit = createLoadingCircuit({
    footprintLibraryMap: {
      kicad: async (name) => ({
        footprintCircuitJson: await (name === "first"
          ? first.promise
          : second.promise),
      }),
    },
  })
  circuit.add(
    <board width={10} height={10}>
      <group name="loaders">
        <resistor name="R1" resistance="10k" footprint="kicad:first" />
        <resistor name="R2" resistance="10k" footprint="kicad:second" />
      </group>
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  const resistor = circuit.selectOne(".R1")!
  const originalChildren = resistor.children.length
  const removedGroup = circuit.selectOne(".loaders")!
  removedGroup.parent!.remove(removedGroup)
  await settled
  first.resolve(external0402Footprint)
  second.reject(new Error("late library failure"))
  await flushLoading()
  expect(resistor.children).toHaveLength(originalChildren)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
