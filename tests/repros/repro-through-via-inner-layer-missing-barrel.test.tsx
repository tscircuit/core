import { expect, test } from "bun:test"
import { ThroughViaInnerLayerBoard } from "tests/fixtures/through-via-inner-layer-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a missing through barrel leaves the top escape disconnected from inner2", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ThroughViaInnerLayerBoard omitLeftVia />)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  const errors = circuit.db.pcb_trace_error.list()
  expect(
    errors.some((error) => error.message.includes("missing a connection")),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
