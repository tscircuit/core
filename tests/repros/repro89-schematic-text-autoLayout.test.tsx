import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

it("repro89: schematic text autoLayout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group name="StepperDriver">
        <schematictext text="Stepper Driver" fontSize={0.4} schX={4} schY={4} />
        <chip
          name="P1"
          schWidth={0.6}
          schPinArrangement={{
            leftSide: ["pin1", "pin2", "pin3", "pin4"],
          }}
          pinLabels={{
            pin1: "A1",
            pin2: "B1",
            pin3: "A2",
            pin4: "B2",
          }}
        />

        <capacitor
          name="C3"
          capacitance="0.1uF"
          footprint="0402"
          connections={{
            pin1: "net.GND",
          }}
        />

        <capacitor
          name="C9"
          capacitance="0.1uF"
          footprint="0402"
          connections={{
            pin1: "net.GND",
            pin2: "net.VCC_5",
          }}
        />
        <resistor
          name="R8"
          resistance="100ohm"
          footprint="0402"
          connections={{
            pin1: "net.VCC_5",
            pin2: sel.R10.pin1,
          }}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
