import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit orientation opt-out preserves the PCB and skips supplier analysis", async () => {
  const orientationCacheKeys: string[] = []
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C85202"] }),
    fetchPartCircuitJson: () => {
      return []
    },
  }
  const { circuit } = getTestFixture({
    platform: {
      partsEngine,
      enablePartOrientationAnalysis: false,
      localCacheEngine: {
        getItem: () => null,
        setItem: (key) => {
          if (key.startsWith("part-orientation-analysis:"))
            orientationCacheKeys.push(key)
        },
      },
    },
  })
  circuit.add(
    <board width={10} height={10}>
      <chip
        name="Q1"
        footprint="sot23"
        supplierPartNumbers={{ jlcpcb: ["C85202"] }}
      />
      <pcbnotetext
        text="Orientation analysis explicitly disabled"
        pcbX={0}
        pcbY={-3}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pcb = circuit.db.pcb_component.list()[0]!
  expect(pcb.pin1_location).toBeUndefined()
  expect(pcb.supplier_pin1_location_map).toBeUndefined()
  expect(orientationCacheKeys).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
