import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("netlabel connected to another net finishes rendering", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled schMaxTraceDistance={1}>
      <netlabel net="DC_IN" connection="net.A" anchorSide="left" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(
    circuit.db.source_net
      .list()
      .map((net) => net.name)
      .sort(),
  ).toEqual(["A", "DC_IN"])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 2_000)
