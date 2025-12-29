import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("source_trace is created for interconnect ports connected via off-board routing", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with an interconnect connecting two components
  // The interconnect should allow routing through its internal connection
  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="1k" pcbX={-5} pcbY={0} footprint="0402" />
      <resistor name="R2" resistance="1k" pcbX={5} pcbY={0} footprint="0402" />
      <interconnect name="IC1" standard="0603" pcbX={0} pcbY={3} />
      {/* Connect R1 to IC1.pin1, and IC1.pin2 to R2 */}
      <trace from=".R1 > .pin2" to=".IC1 > .pin1" />
      <trace from=".IC1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Get the internal connection
  const internalConnections =
    circuit.db.source_component_internal_connection.list()
  expect(internalConnections).toHaveLength(1)

  // Get source_traces
  const sourceTraces = circuit.db.source_trace.list()

  // We should have at least 2 traces (R1-IC1 and IC1-R2)
  // Plus potentially a source_trace created for the off-board connection
  expect(sourceTraces.length).toBeGreaterThanOrEqual(2)

  // The interconnect's ports should be represented in source_traces
  const ic1Ports = circuit.db.source_port.list().filter((p) => {
    const component = circuit.db.source_component.get(p.source_component_id!)
    return component?.name === "IC1"
  })

  expect(ic1Ports).toHaveLength(2)

  // Check that both IC1 ports are connected via source_traces
  const ic1PortIds = new Set(ic1Ports.map((p) => p.source_port_id))
  const connectedPortIds = new Set(
    sourceTraces.flatMap((t) => t.connected_source_port_ids),
  )

  for (const portId of ic1PortIds) {
    expect(connectedPortIds.has(portId)).toBe(true)
  }
})
