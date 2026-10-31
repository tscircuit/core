import { expect, test } from "bun:test"
import headerFootprint from "tests/fixtures/assets/jlcpcb-C6800644-header.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported pin labels remain absent without pcbPinLabels", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({ footprintCircuitJson: headerFootprint }),
      },
    },
  })
  circuit.add(
    <board width={22} height={12} routingDisabled>
      <chip name="J1" footprint="jlcpcb:C6800644" pinLabels={{ pin1: "GND" }} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_silkscreen_text.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
