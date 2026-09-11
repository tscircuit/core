import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// R5 and R6 are the closer pair, but automatic trace labeling separates R6
// and keeps the longer U1-to-R5 connection as a physical trace.
test("repro186: multi-endpoint net keeps the longer routed segment", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled>
      <chip name="U1" pinLabels={{ pin1: "OUT" }} schX={0} schY={-4} />
      <resistor name="R5" resistance="100k" schX={0} schY={0} />
      <resistor name="R6" resistance="10k" schX={3} schY={0} />

      <trace from=".U1 > .OUT" to="net.PREAMP" />
      <trace from=".R5 > .pin1" to="net.PREAMP" />
      <trace from=".R6 > .pin1" to="net.PREAMP" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
