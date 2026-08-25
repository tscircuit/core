import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic box pin styles override inherited chip pin styles", async () => {
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
          schPinStyle={{
            IO0: { marginBottom: 0, marginRight: "0.5mm" },
            pin2: { marginBottom: 0.4 },
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
          IO0: { marginBottom: 0.8, marginLeft: 0.15 },
          IO1: { marginTop: 0.6 },
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
      bottom_margin: 0,
      left_margin: 0.15,
      right_margin: 0.5,
      top_margin: undefined,
    },
    pin2: {
      bottom_margin: 0.4,
      left_margin: undefined,
      right_margin: undefined,
      top_margin: 0.6,
    },
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
