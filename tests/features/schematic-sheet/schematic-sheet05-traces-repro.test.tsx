import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("connections-generated traces inherit a sibling group's schematic sheet", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsheet name="power" displayName="Power Sheet" sheetIndex={0} />
      <schematicsheet
        name="control"
        displayName="Control Sheet"
        sheetIndex={1}
      />

      <group name="POWER" schSheetName="power">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          schX={-2}
          connections={{ pin2: "net.POWER_SIGNAL" }}
        />
        <resistor
          name="R2"
          resistance="2k"
          footprint="0402"
          schX={2}
          connections={{ pin1: "net.POWER_SIGNAL" }}
        />
      </group>

      <group name="CONTROL" schSheetName="control">
        <resistor
          name="R3"
          resistance="3k"
          footprint="0402"
          schX={-2}
          connections={{ pin2: "net.CONTROL_SIGNAL" }}
        />
        <resistor
          name="R4"
          resistance="4k"
          footprint="0402"
          schX={2}
          connections={{ pin1: "net.CONTROL_SIGNAL" }}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const powerSheet = circuit.db.schematic_sheet.getWhere({ name: "power" })!
  const controlSheet = circuit.db.schematic_sheet.getWhere({ name: "control" })!

  const schematicTraceSheetIds = circuit.db.schematic_trace
    .list()
    .map((trace) => trace.schematic_sheet_id)

  expect(schematicTraceSheetIds).not.toContain(undefined)
  expect(new Set(schematicTraceSheetIds)).toEqual(
    new Set([powerSheet.schematic_sheet_id, controlSheet.schematic_sheet_id]),
  )

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
