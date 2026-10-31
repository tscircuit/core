import { expect, test } from "bun:test"
import headerFootprint from "tests/fixtures/assets/jlcpcb-C160316-vh-header.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported JST VH header does not render its requested PCB pin labels", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({ footprintCircuitJson: headerFootprint }),
      },
    },
  })

  circuit.add(
    <board width={26} height={22} routingDisabled schAutoLayoutEnabled>
      <chip
        name="J_AC"
        manufacturerPartNumber="B3P-VH(LF)(SN)"
        footprint="jlcpcb:C160316"
        pinLabels={{ pin1: "L", pin2: "NC", pin3: "N" }}
        pcbPinLabels={{ pin1: "L", pin2: "NC", pin3: "N" }}
      />
      <pcbnotetext text="J_AC / C160316" pcbY={9} fontSize={0.8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(3)
  expect(circuit.db.pcb_silkscreen_text.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
