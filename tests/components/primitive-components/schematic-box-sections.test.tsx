import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { SchematicBox } from "lib/components/primitive-components/SchematicBox/SchematicBox"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip-backed schematic boxes participate in schematic sections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <schematicsection
        name="power"
        displayName="PWR"
        sectionTitleFontSize={0.1}
      />
      <schematicsection
        name="io"
        displayName="I/O"
        sectionTitleFontSize={0.1}
      />
      <chip
        name="U1"
        footprint="soic8"
        noSchematicRepresentation
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "TX",
          pin4: "RX",
        }}
      />
      <schematicbox
        name="U1 Power"
        chipRef=".U1"
        schSectionName="power"
        schX={-2.5}
        width={2}
        height={1}
        pinLabels={{ pin1: "VCC", pin2: "GND" }}
        schPinArrangement={{
          leftSide: ["pin1", "pin2"],
          rightSide: [],
        }}
      />
      <schematicbox
        name="U1 I/O"
        chipRef=".U1"
        schSectionName="io"
        schX={2.5}
        width={2}
        height={1}
        pinLabels={{ pin1: "TX", pin2: "RX" }}
        schPinArrangement={{
          leftSide: [],
          rightSide: ["pin1", "pin2"],
        }}
      />
    </board>,
  )

  circuit.render()

  const board = circuit.firstChild as Group<any>
  const schematicBoxes = board.children.filter(
    (child): child is SchematicBox => child instanceof SchematicBox,
  )
  const { inputProblem } = createSchematicTraceSolverInputProblem(board)
  const sectionIdsByBoxName = Object.fromEntries(
    schematicBoxes.map((schematicBox) => [
      schematicBox.name,
      inputProblem.chips.find(
        (chip) => chip.chipId === schematicBox.schematic_component_id,
      )?.sectionId,
    ]),
  )

  expect(sectionIdsByBoxName).toEqual({
    "U1 Power": "power",
    "U1 I/O": "io",
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
