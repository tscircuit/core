import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("netlabel fails component creation when net and connection are provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled schMaxTraceDistance={1}>
      <netlabel net="DC_IN" connection="net.A" anchorSide="left" />
      <schematictext text="Invalid netlabel" fontSize={0.2} schX={-1} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(0)
  expect(circuit.db.source_net.list()).toHaveLength(0)
  expect(circuit.db.schematic_net_label.list()).toHaveLength(0)
  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    error_type: "source_failed_to_create_component_error",
  })
  expect(errors[0].message).toContain(
    "net and connection cannot be provided together",
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 2_000)
