import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthDrcTrace } from "tests/fixtures/length-drc-trace"

test("standalone subcircuit emits the trace length error without a board", async () => {
  const { circuit } = getTestFixture({ platform: { schematicDisabled: true } })
  circuit.add(
    <subcircuit name="SIGNAL">
      <LengthDrcTrace explanation="Standalone subcircuit: routing DRC enabled" />
    </subcircuit>,
  )
  await circuit.renderUntilSettled()
  const errors = circuit.db.pcb_trace_too_long_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    actual_trace_length: 30,
    maximum_trace_length: 24,
  })
  expect(errors[0].subcircuit_id).toBe(
    circuit.db.source_trace.list()[0].subcircuit_id,
  )

  const { circuit: annotated } = getTestFixture({
    platform: { schematicDisabled: true },
  })
  annotated.add(
    <subcircuit name="SIGNAL">
      <LengthDrcTrace
        explanationColor="#ff6b6b"
        explanation={`<subcircuit name="SIGNAL">\n30 mm > 24 mm: 6 mm too long\nDRC: ${errors[0].message.replace(", ", ",\n")}`}
      />
    </subcircuit>,
  )
  await annotated.renderUntilSettled()
  expect(annotated.db.pcb_trace_too_long_error.list()).toEqual(errors)
  await expect(annotated).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 800,
    viewport: { minX: -20, minY: -15, maxX: 20, maxY: 15 },
  })
})
