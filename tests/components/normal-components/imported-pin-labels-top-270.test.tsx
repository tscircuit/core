import { expect, test } from "bun:test"
import headerFootprint from "tests/fixtures/assets/jlcpcb-C6800644-header.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported pin labels follow top-layer pads at 270 degrees", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({ footprintCircuitJson: headerFootprint }),
      },
    },
  })
  circuit.add(
    <board width={12} height={22} routingDisabled>
      <chip
        name="J1"
        footprint="jlcpcb:C6800644"
        pcbRotation={270}
        pcbPinLabels={{ pin1: "GND" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pin1 = circuit.db.pcb_plated_hole
    .list()
    .find((pad) => pad.port_hints?.includes("pin1"))!
  const label = circuit.db.pcb_silkscreen_text.list()[0]!
  expect(label.anchor_position.x).toBeLessThan(pin1.x)
  expect(label.anchor_position.y).toBeCloseTo(pin1.y)
  expect(label.layer).toBe("top")
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
