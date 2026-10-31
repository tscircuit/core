import { expect, test } from "bun:test"
import headerFootprint from "tests/fixtures/assets/jlcpcb-C6800644-header.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported programming header renders its requested PCB pin labels", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({ footprintCircuitJson: headerFootprint }),
      },
    },
  })

  circuit.add(
    <board width={18} height={22} routingDisabled schAutoLayoutEnabled>
      <chip
        name="J_PROG"
        manufacturerPartNumber="17-0020-002"
        footprint="jlcpcb:C6800644"
        pcbX={-3}
        pcbRotation={90}
        pinLabels={{
          pin1: "GND",
          pin2: "V3V3",
          pin3: "TX",
          pin4: "RX",
          pin5: "BOOT",
          pin6: "RST",
        }}
        pcbPinLabels={{
          pin1: "GND",
          pin2: "3V3",
          pin3: "TX",
          pin4: "RX",
          pin5: "BOOT",
          pin6: "RESET",
        }}
      />
      <pcbnotetext text="J_PROG / C6800644" pcbY={9} fontSize={0.8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(6)
  expect(
    circuit.db.pcb_silkscreen_text.list().map((label) => label.text),
  ).toEqual(["GND", "3V3", "TX", "RX", "BOOT", "RESET"])
  const pin1 = circuit.db.pcb_plated_hole
    .list()
    .find((pad) => pad.port_hints?.includes("pin1"))!
  const groundLabel = circuit.db.pcb_silkscreen_text.list()[0]!
  expect(groundLabel.anchor_position.x).toBeGreaterThan(pin1.x)
  expect(groundLabel.anchor_position.y).toBeCloseTo(pin1.y)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
