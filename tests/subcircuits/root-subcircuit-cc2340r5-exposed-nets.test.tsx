import { expectWiredInterface } from "tests/fixtures/cc2340r5-reference/expect-wired-interface"
import { expect, test } from "bun:test"
import Cc2340Reference, {
  exportedNets,
} from "tests/fixtures/cc2340r5-reference"
import { getElectricalSignature } from "tests/fixtures/cc2340r5-reference/electrical-signature"
import moduleSignature from "tests/fixtures/cc2340r5-reference/module-electrical-signature"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("exposedNets exports the CC2340R5 GPIO, supply and SWD nets while preserving the reference support circuit", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(<Cc2340Reference interfaceMode="nets" schX={4} schY={-2} />)
  await circuit.renderUntilSettled()
  const group = circuit.db.schematic_group
    .list()
    .find((group) => group.show_boundary)!
  const publicPorts = circuit.db.source_port
    .list()
    .filter((port) => port.source_group_id === group.source_group_id)
  expect(publicPorts.map((port) => port.name)).toEqual([...exportedNets])
  for (const port of publicPorts) {
    const net = circuit.db.source_net
      .list()
      .find((net) => net.name === port.name)!
    expect(port.subcircuit_connectivity_map_key).toBe(
      net.subcircuit_connectivity_map_key,
    )
    expect(
      circuit.db.source_trace
        .list()
        .some(
          (trace) =>
            trace.connected_source_port_ids.includes(port.source_port_id) &&
            trace.connected_source_net_ids.includes(net.source_net_id),
        ),
    ).toBe(true)
  }
  expect(getElectricalSignature(circuit.getCircuitJson())).toEqual(
    moduleSignature,
  )
  expect(group.center.x).toBeGreaterThan(4)
  expect(group.center.y).toBeLessThan(-2)
  expectWiredInterface(circuit)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1600,
    height: 1250,
    grid: false,
  })
}, 20_000)
