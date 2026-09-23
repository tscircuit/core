import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaSelfShortBoard } from "tests/fixtures/via-self-short-board"

test("reducing via copper clears the matched-route self-short", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ViaSelfShortBoard
      viaDiameter={0.3}
      message="Smaller via land: positive clearance, no self-short"
    />,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("shorts to itself")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 750,
    shouldDrawErrors: false,
  })
})
