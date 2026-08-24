import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic trace solver input uses port display names", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "DATA_IN",
          pin4: "DATA_OUT",
        }}
      />
    </board>,
  )

  circuit.render()

  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group<any>,
  )
  const schematicPortDisplayNameById = new Map(
    circuit.db.schematic_port
      .list()
      .map((schematicPort) => [
        schematicPort.schematic_port_id,
        schematicPort.display_pin_label ??
          schematicPort.pin_number?.toString() ??
          circuit.db.source_port.get(schematicPort.source_port_id)?.name,
      ]),
  )

  for (const inputPin of inputProblem.chips.flatMap((chip) => chip.pins)) {
    expect(inputPin).toHaveProperty(
      "displayName",
      schematicPortDisplayNameById.get(inputPin.pinId),
    )
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
