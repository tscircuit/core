import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("redundant net label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="48mm" height="58mm">
      <net name="VCC" />
      <net name="GND" />
      <connector
        name="JUSB"
        schX={-1.5}
        schY={2.5}
        pinLabels={{
          pin1: "GND",
          pin2: "TRIG",
          pin3: "OUT",
          pin4: "RESET",
          pin5: "CTRL",
          pin6: "THRES",
          pin7: "DISCH",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2", "pin3", "pin4"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin5", "pin6", "pin7", "pin8"],
          },
        }}
      />

      <resistor
        name="R2"
        resistance="10k"
        footprint="0805"
        schX={2.5}
        schY={2.5}
      />
      <chip
        name="U1"
        footprint="soic8"
        schX={5.5}
        schY={2.5}
        pinLabels={{
          pin1: "GND",
          pin2: "TRIG",
          pin3: "OUT",
          pin4: "RESET",
          pin5: "CTRL",
          pin6: "THRES",
          pin7: "DISCH",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["RESET", "CTRL", "THRES", "TRIG"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "OUT", "DISCH", "GND"],
          },
        }}
      />

      <trace from=".R2 > .pin1" to=".JUSB > .pin8" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit.db.schematic_net_label.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
