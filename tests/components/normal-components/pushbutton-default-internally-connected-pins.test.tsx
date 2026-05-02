import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton defaults internally connected pin pairs", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <pushbutton name="SW1" footprint="pushbutton" pcbX={0} pcbY={0} />
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={8} pcbY={0} />
      <trace from=".SW1 > .pin1" to="net.VCC" />
      <trace from=".SW1 > .pin3" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sw1 = circuit.selectOne("pushbutton.SW1") as any
  expect(sw1.internallyConnectedPinNames).toEqual([
    ["pin1", "pin2"],
    ["pin3", "pin4"],
  ])

  const missingTraceWarnings = circuit.db.source_pin_missing_trace_warning
    .list()
    .filter((warning) => warning.message.includes("SW1"))

  expect(missingTraceWarnings).toHaveLength(0)
})
