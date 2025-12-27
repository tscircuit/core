import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("no false positive missing trace DRC warning for interconnect ports connected via off-board routing", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit where traces go through an interconnect
  // The interconnect connects two nets that wouldn't otherwise be connected
  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="1k" pcbX={-5} pcbY={0} footprint="0402" />
      <resistor name="R2" resistance="1k" pcbX={5} pcbY={0} footprint="0402" />
      <interconnect name="IC1" standard="0603" pcbX={0} pcbY={3} />
      <trace from=".R1 > .pin2" to=".IC1 > .pin1" />
      <trace from=".IC1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Get DRC warnings for missing traces
  const missingTraceWarnings =
    circuit.db.source_pin_missing_trace_warning.list()

  // Filter to only warnings about IC1 ports
  const ic1Component = circuit.db.source_component
    .list()
    .find((c) => c.name === "IC1")
  const ic1Warnings = missingTraceWarnings.filter(
    (w) => w.source_component_id === ic1Component?.source_component_id,
  )

  // There should be no missing trace warnings for IC1 ports since they are
  // connected through the internal connection
  expect(ic1Warnings).toHaveLength(0)
})
