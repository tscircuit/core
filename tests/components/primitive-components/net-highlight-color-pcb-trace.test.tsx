import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net highlightColor is written through to pcb_trace.highlight_color", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <net name="VCC" highlightColor="#ff0000" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".R2 > .pin2" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()

  // The VCC net is routed, so at least one pcb_trace is emitted.
  expect(pcbTraces.length).toBeGreaterThan(0)

  // Every routed trace on the VCC net carries the net's highlightColor.
  // Before the fix pcb_trace.highlight_color was always undefined, so this
  // fails on main and passes with the wire-through.
  for (const pcbTrace of pcbTraces) {
    expect(pcbTrace.highlight_color).toBe("#ff0000")
  }
})
