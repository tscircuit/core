import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton resolves documented side1 and side2 aliases via connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        connections={{ side1: "net.LEFT", side2: "net.RIGHT" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((e) => e.type === "source_trace_not_connected_error"),
  ).toHaveLength(0)

  const traces = circuit.db.source_trace.list()
  expect(traces).toHaveLength(2)

  const side1Port = circuit.selectOne(".SW1 > .side1") as Port | null
  const side2Port = circuit.selectOne(".SW1 > .side2") as Port | null
  expect(side1Port).not.toBeNull()
  expect(side2Port).not.toBeNull()
  expect(side1Port?.source_port_id).not.toBe(side2Port?.source_port_id)
})

test("pushbutton side1 and side2 resolve to distinct terminals when pins 1-2 and 3-4 are internally connected", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        internallyConnectedPins={[
          ["pin1", "pin2"],
          ["pin3", "pin4"],
        ]}
      />
      <trace from=".SW1 > .side1" to="net.A" />
      <trace from=".SW1 > .side2" to="net.B" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.source_trace.list()).toHaveLength(2)

  const side1Port = circuit.selectOne(".SW1 > .side1") as Port | null
  const side2Port = circuit.selectOne(".SW1 > .side2") as Port | null
  expect(side1Port?.props.pinNumber).toBe(1)
  expect(side2Port?.props.pinNumber).toBe(3)
})

test("2-pin pushbutton resolves side1 to pin1 and side2 to pin2", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        connections={{ side1: "net.IN", side2: "net.OUT" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.source_trace.list()).toHaveLength(2)

  const side1Port = circuit.selectOne(".SW1 > .side1") as Port | null
  const side2Port = circuit.selectOne(".SW1 > .side2") as Port | null
  expect(side1Port?.props.pinNumber).toBe(1)
  expect(side2Port?.props.pinNumber).toBe(2)
})
