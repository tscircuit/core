import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const allPinLabels = {
  pin1: "VCC",
  pin2: "GND",
  pin3: "IO0",
  pin4: "IO1",
  pin5: "IO2",
  pin6: "IO3",
  pin7: "IO4",
  pin8: "IO5",
  pin9: "IO6",
  pin10: "IO7",
}

const MainChip = (props: any) => (
  <chip name={props.name} pinLabels={allPinLabels} {...props} />
)

test("multiple schematic sheets to represent the same chip component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <schematicsheet name="U1A Sheet" displayName="U1A Sheet" sheetIndex={0}>
        <schematicbox
          name="U1A"
          width={2.245}
          height={1.0}
          chipRef="U1"
          pinLabels={{
            pin1: "VCC",
            pin2: "GND",
          }}
          schPinArrangement={{
            leftSide: ["pin1", "pin2"],
            rightSide: [],
          }}
        />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          connections={{ pin1: "U1.VCC" }}
        />
      </schematicsheet>

      <schematicsheet name="U1B Sheet" displayName="U1B Sheet" sheetIndex={1}>
        <schematicbox
          name="U1B"
          width={2.245}
          height={1.0}
          chipRef="U1"
          pinLabels={{
            pin1: "IO0",
            pin2: "IO1",
            pin3: "IO2",
            pin4: "IO3",
            pin5: "IO4",
            pin6: "IO5",
            pin7: "IO6",
            pin8: "IO7",
          }}
          schPinArrangement={{
            leftSide: ["pin1", "pin2", "pin3", "pin4"],
            rightSide: ["pin5", "pin6", "pin7", "pin8"],
          }}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          connections={{ pin1: "U1.IO0" }}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          connections={{ pin1: "U1.IO1" }}
        />
      </schematicsheet>

      <MainChip name="U1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
