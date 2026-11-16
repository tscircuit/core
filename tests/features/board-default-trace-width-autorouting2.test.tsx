import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getWireWidths } from "tests/fixtures/get-wire-widths"

test("explicit trace thickness takes precedence over board defaultTraceWidth", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" defaultTraceWidth="0.3mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" thickness="0.5mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.5)
  }
})
