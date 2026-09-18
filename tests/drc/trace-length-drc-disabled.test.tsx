import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthDrcTrace } from "tests/fixtures/length-drc-trace"

test("routingDrcChecksDisabled suppresses length errors without removing manual copper", async () => {
  const { circuit } = getTestFixture({
    platform: { routingDrcChecksDisabled: true },
  })
  circuit.add(
    <board width={40} height={30} schematicDisabled>
      <LengthDrcTrace
        explanation={
          "platform: { routingDrcChecksDisabled: true }\nD1 is 30 mm > 24 mm, but routing DRC is disabled.\nExpected: no length error."
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.source_trace.list()[0].max_length).toBe(24)
  expect(circuit.db.pcb_trace_too_long_error.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 800,
  })
})
