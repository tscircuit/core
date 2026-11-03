import { expect, spyOn, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Found while running `tsci simulate` on a simple RC simulation board (tsci
// simulate has no --routing-disabled flag). <voltagesource> creates a
// pcb_component but no pads/pcb_ports, even with a footprint. A trace to it
// makes getSimpleRouteJsonFromCircuitJson throw
// "undefined is not an object (evaluating 'connectedPort.x')", which aborts
// local autorouting for the WHOLE board: R1-R2 below has pads on both ends
// but is never routed either.
test("repro: a trace to a voltagesource aborts autorouting for every trace", async () => {
  const consoleError = spyOn(console, "error")
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="15mm">
      <voltagesource name="V1" voltage="5V" footprint="0402" pcbX={-5} />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from=".V1 > .pin1" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const v1 = circuit.db.source_component.list().find((c) => c.name === "V1")!
  const v1PcbComponent = circuit.db.pcb_component
    .list()
    .find((c) => c.source_component_id === v1.source_component_id)
  expect(v1PcbComponent).toBeDefined()
  // Actual: the voltage source has a pcb_component but no pads or ports.
  expect(
    circuit.db.pcb_port
      .list()
      .filter((p) => p.pcb_component_id === v1PcbComponent!.pcb_component_id),
  ).toHaveLength(0)

  // Actual: the router crashed with connectedPort.x ...
  expect(
    consoleError.mock.calls.some((args) =>
      args.some((arg) =>
        String(arg?.message ?? arg).includes("connectedPort.x"),
      ),
    ),
  ).toBe(true)
  consoleError.mockRestore()

  // ... so even the routable R1-R2 trace has no pcb_trace.
  // Expected: R1-R2 is routed and only the V1 trace reports an error.
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(
    circuit.db.pcb_trace_missing_error
      .list()
      .map((e) => e.message)
      .some((m) => m.includes(".R1 > .pin2 to .R2 > .pin1")),
  ).toBe(true)
})
