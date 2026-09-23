import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaSelfShortBoard } from "tests/fixtures/via-self-short-board"

test("board routing DRC detects a subtle via self-short on a matched trace", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<ViaSelfShortBoard />)
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_trace_error
    .list()
    .filter((error) => error.message.includes("shorts to itself"))
  expect(errors).toHaveLength(1)
  expect(errors[0]!.message).toBe(
    'PCB trace "DATA_P" shorts to itself, bypassing part of its length-matched route',
  )
  expect(errors[0]!.center?.x).toBeCloseTo(0)
  expect(errors[0]!.center?.y).toBeCloseTo(-0.8)
  const { circuit: annotated } = getTestFixture()
  annotated.add(<ViaSelfShortBoard message={errors[0]!.message} />)
  await annotated.renderUntilSettled()
  await expect(annotated).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 750,
    shouldDrawErrors: false,
  })
})
