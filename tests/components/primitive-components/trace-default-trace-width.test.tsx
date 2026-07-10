import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace routing uses board defaultTraceWidth when thickness is omitted", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" defaultTraceWidth="0.3mm">
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
  // Bug repro: board.defaultTraceWidth is 0.3mm, but autorouted wires still
  // come out at 0.15mm. The expected fixed behavior should be 0.3.
  expect(routedWireWidths.every((width) => width === 0.15)).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
