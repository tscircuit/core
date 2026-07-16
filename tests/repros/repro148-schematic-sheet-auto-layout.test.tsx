import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// biome-ignore lint/suspicious/noExportsInTest: Exported for placement diagnostics.
export const SchematicSheetAutoLayoutRepro = () => (
  <board routingDisabled schMaxTraceDistance={10}>
    <schematicsheet name="Main" displayName="Main" sheetIndex={0}>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "IN",
          pin2: "GND",
          pin3: "OUT",
        }}
      />

      <connector
        name="J1"
        footprint="pinrow2_p2.54mm"
        pinLabels={{ pin1: "IN", pin2: "GND" }}
        connections={{
          pin1: "U1.pin1",
        }}
      />

      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        connections={{
          pin1: "U1.pin3",
        }}
      />
    </schematicsheet>
  </board>
)

test("repro148: schematic sheet children are auto laid out", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<SchematicSheetAutoLayoutRepro />)
  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
