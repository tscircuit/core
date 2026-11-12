import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("root exposedNets become public terminals connected to the existing local nets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <subcircuit
      name="PULLUP"
      exposedNets={["VCC", "net.SIGNAL", "SIGNAL"]}
      schMaxTraceDistance={100}
    >
      <resistor
        name="R1"
        footprint="0603"
        resistance="10k"
        schX={0}
        schY={0}
        connections={{ pin1: "net.VCC", pin2: "net.SIGNAL" }}
      />
      <net name="PRIVATE" />
    </subcircuit>,
  )
  await circuit.renderUntilSettled()
  const publicPorts = circuit.db.source_port
    .list()
    .filter((port) => port.source_group_id)
  expect(publicPorts.map((port) => port.name)).toEqual(["VCC", "SIGNAL"])
  for (const port of publicPorts) {
    const net = circuit.db.source_net
      .list()
      .find((net) => net.name === port.name)!
    expect(
      circuit.db.source_trace
        .list()
        .some(
          (trace) =>
            trace.connected_source_port_ids.includes(port.source_port_id) &&
            trace.connected_source_net_ids.includes(net.source_net_id),
        ),
    ).toBe(true)
    expect(port.subcircuit_connectivity_map_key).toBe(
      net.subcircuit_connectivity_map_key,
    )
  }
  expect(circuit.db.source_group.list()).toHaveLength(1)
  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("Multiple immediate children")),
  ).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
