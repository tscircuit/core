import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("schematic pins follow direction on single side arrangement", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        footprint="pinrow7"
        name="J1"
        pinLabels={{
          pin1: "VBUS",
          pin2: "DP",
          pin3: "DM",
          pin4: "CC1",
          pin5: "CC2",
          pin6: "SHLD",
          pin7: "GND",
        }}
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VBUS", "DP", "DM", "CC1", "CC2", "SHLD", "GND"],
          },
        }}
      />
    </board>,
  )

  circuit.render()

  const schChip = circuit.db.schematic_component
    .list()
    .find((sc) => sc.port_arrangement)

  const ports = circuit.db.schematic_port
    .list()
    .filter((p) => p.schematic_component_id === schChip?.schematic_component_id)
    .sort((a, b) => a.center.y - b.center.y)

  const bottomPortLabel = circuit.db.source_port.get(
    ports[0]!.source_port_id!,
  )?.name
  expect(bottomPortLabel).toBe("GND")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
