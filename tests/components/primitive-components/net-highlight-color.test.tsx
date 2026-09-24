import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net highlightColor is written to pcb_trace.highlight_color", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <net name="VCC" highlightColor="#ff0000" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".R2 > .pin2" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit
    .getCircuitJson()
    .filter((e: any) => e.type === "pcb_trace") as any[]

  expect(pcbTraces.length).toBeGreaterThan(0)
  for (const pcbTrace of pcbTraces) {
    expect(pcbTrace.highlight_color).toBe("#ff0000")
  }
})
