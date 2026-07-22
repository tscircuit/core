import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace routing uses board nominalTraceWidth when thickness is omitted", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" nominalTraceWidth="0.25mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const routedWireWidths = circuit.db.pcb_trace
    .list()
    .flatMap((trace) =>
      trace.route
        .filter((point) => point.route_type === "wire")
        .map((point) => point.width),
    )

  expect(routedWireWidths.length).toBeGreaterThan(0)
  expect(routedWireWidths.every((width) => width === 0.25)).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
