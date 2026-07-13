import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("netlabel cannot connect two nets", async () => {
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
  expect(
    circuit.db.source_failed_to_create_component_error.list(),
  ).toMatchObject([
    {
      component_name: "DC_IN",
      error_type: "source_failed_to_create_component_error",
      message:
        'Cannot create netlabel "DC_IN": connection must reference a port, not net selector "net.A"',
    },
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 2_000)
