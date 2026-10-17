import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton resolves documented side1 and side2 aliases to its two switch terminals", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from=".SW1 > .side1" to=".R1 > .pin1" />
      <trace from=".SW1 > .side2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)

  const swPorts = circuit.db.source_port
    .list()
    .filter((p) => p.name === "pin1" || p.name === "pin3")
  const pin1Port = swPorts.find((p) => p.name === "pin1")!
  const pin3Port = swPorts.find((p) => p.name === "pin3")!

  expect(pin1Port.port_hints).toContain("side1")
  expect(pin3Port.port_hints).toContain("side2")

  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(2)
  expect(
    traces.some((t) =>
      t.connected_source_port_ids.includes(pin1Port.source_port_id),
    ),
  ).toBe(true)
  expect(
    traces.some((t) =>
      t.connected_source_port_ids.includes(pin3Port.source_port_id),
    ),
  ).toBe(true)
})
