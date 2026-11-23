import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a bounded terminal-to-terminal connection keeps its scope beside a load capacitor", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <pinheader name="MCU" pinCount={1} pcbX={-3} />
      <pinheader name="XTAL" pinCount={1} pcbX={2} />
      <capacitor name="C1" capacitance="12pF" footprint="0402" pcbY={2} />
      <trace
        name="clock"
        path={["MCU.pin1", "XTAL.pin1", "net.CLK"]}
        maxLength="10mm"
        maxViaCount={0}
      />
      <trace from="C1.pin1" to="net.CLK" />
    </board>,
  )
  circuit.render()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  const sourceTrace = circuit.db.source_trace.getWhere({ name: "clock" })!
  const clock = simpleRouteJson.connections.find(
    (c) => c.source_trace_id === sourceTrace.source_trace_id,
  )!
  const terminals = sourceTrace.connected_source_port_ids.map(
    (id) => circuit.db.pcb_port.getWhere({ source_port_id: id })!.pcb_port_id,
  )
  expect(clock.pointsToConnect.map((p) => p.pcb_port_id)).toEqual(terminals)
  expect(clock.maxLength).toBe(10)
  expect(clock.maxViaCount).toBe(0)
  const tap = simpleRouteJson.connections.find(
    (c) => c.name === clock.netConnectionName,
  )!
  expect(tap.pointsToConnect).toHaveLength(2)
  expect(
    tap.pointsToConnect.filter((p) => terminals.includes(p.pcb_port_id!)),
  ).toHaveLength(1)
  expect(tap.maxLength).toBeUndefined()
  expect(tap.maxViaCount).toBeUndefined()
})
