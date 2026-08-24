import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic box inherits pin styles from its referenced chip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <schematicsheet name="IO Sheet" displayName="IO Sheet" sheetIndex={0}>
        <schematicbox
          name="U1_IO"
          width={2}
          height={1.5}
          chipRef=".U1"
          pinLabels={{
            pin1: "IO0",
            pin2: "IO1",
          }}
          schPinArrangement={{
            leftSide: {
              pins: ["pin1", "pin2"],
              direction: "top-to-bottom",
            },
          }}
        />
      </schematicsheet>

      <chip
        name="U1"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "IO0",
          pin4: "IO1",
        }}
        schPinStyle={{
          IO0: { marginBottom: 0.8 },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicBoxComponent = circuit.db.schematic_component
    .list()
    .find((component) => component.port_labels?.["1"] === "IO0")

  expect(schematicBoxComponent?.pin_styles).toEqual({
    pin1: {
      bottom_margin: 0.8,
      left_margin: undefined,
      right_margin: undefined,
      top_margin: undefined,
    },
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
