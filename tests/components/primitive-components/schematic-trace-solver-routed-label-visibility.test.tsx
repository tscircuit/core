import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fully routed connection label visibility follows assigned display labels", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board schMaxTraceDistance={100}>
      <resistor name="R1" resistance="1k" schX={-2} schY={1} />
      <resistor name="R2" resistance="1k" schX={2} schY={1} />
      <resistor name="R3" resistance="1k" schX={-2} schY={-1} />
      <resistor name="R4" resistance="1k" schX={2} schY={-1} />
      <trace from="R1.pin2" to="R2.pin1" />
      <trace from="R3.pin2" to="R4.pin1" schDisplayLabel="sense" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group,
  )
  expect(
    inputProblem.directConnections.map(
      (connection) => connection.labelFullyRoutedConnection,
    ),
  ).toEqual([false, true])
  expect(circuit.db.schematic_trace.list()).toHaveLength(2)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
