import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  external0402Footprint,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("removal interrupts a static resolver before its parser can be started", async () => {
  const assetUrl = loadingDeferred<string>()
  let parserCalls = 0
  const circuit = createLoadingCircuit({
    resolveProjectStaticFileImportUrl: () => assetUrl.promise,
    footprintFileParserMap: {
      kicad_mod: {
        loadFromUrl: async () => {
          parserCalls++
          return { footprintCircuitJson: external0402Footprint }
        },
      },
    },
  })
  circuit.add(
    <board>
      <chip name="U1" footprint="./part.kicad_mod" />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  const chip = circuit.selectOne(".U1")!
  chip.parent!.remove(chip)
  await settled
  assetUrl.resolve("https://assets.test/part.kicad_mod")
  await flushLoading()
  expect(parserCalls).toBe(0)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
