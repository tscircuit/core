import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("interconnect with standard footprint should create source_component_internal_connection", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <interconnect name="IC1" standard="0603" pcbX={0} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const internalConnections =
    circuit.db.source_component_internal_connection.list()

  expect(internalConnections).toHaveLength(1)
  expect(internalConnections[0].source_port_ids).toHaveLength(2)
  expect(internalConnections[0]).toMatchObject({
    type: "source_component_internal_connection",
    source_component_id: expect.any(String),
    source_port_ids: expect.any(Array),
  })
})
