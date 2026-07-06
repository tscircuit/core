import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic trace solver refdes text box borders chip body", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  circuit.render()

  const schematicComponent = circuit.db.schematic_component.list()[0]
  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group<any>,
  )
  const refdesTextBox = inputProblem.textBoxes?.find(
    (textBox) => textBox.text === "U1",
  )

  expect(refdesTextBox).toBeDefined()
  expect(refdesTextBox!.center.y - refdesTextBox!.height / 2).toBeCloseTo(
    schematicComponent.center.y + schematicComponent.size.height / 2,
  )
})
