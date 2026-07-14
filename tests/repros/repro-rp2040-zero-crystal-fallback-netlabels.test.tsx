import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

const crystalPinLabels = {
  pin1: ["XTAL1"],
  pin2: ["GND1"],
  pin3: ["XTAL2"],
  pin4: ["GND2"],
} as const

test("rp2040-zero crystal connection falls back to net labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8mm" height="5mm" routingDisabled>
      <resistor
        name="R8"
        resistance="1k"
        schOrientation="vertical"
        schX={1.07}
        schY={0.67}
      />
      <capacitor
        name="C17"
        capacitance="15pF"
        schOrientation="vertical"
        schX={1.1}
        schY={-0.66}
      />
      <chip
        name="X1"
        manufacturerPartNumber="ABM8_272_T3"
        pinLabels={crystalPinLabels}
        schX={-1.07}
        schY={0.47}
        connections={{
          XTAL2: ["C17.pin1", "R8.pin2"],
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const fallbackLabels = circuit.db.schematic_net_label
    .list()
    .filter((label) => label.text === "R8_pin2/C17_pin1/X1_XTAL2")

  expect(fallbackLabels).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
