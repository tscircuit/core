import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaSelfShortBoard } from "tests/fixtures/via-self-short-board"

test("settling a matched route again does not duplicate its self-short diagnostic", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ViaSelfShortBoard message="Repeated render: one self-short diagnostic" />,
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_trace_error
    .list()
    .filter((error) => error.message.includes("shorts to itself"))
  expect(errors).toHaveLength(1)
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("shorts to itself")),
  ).toEqual(errors)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 750,
    shouldDrawErrors: false,
  })
})
