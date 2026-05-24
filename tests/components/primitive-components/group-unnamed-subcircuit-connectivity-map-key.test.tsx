import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unnamed subcircuit connectivity map keys are deterministic across renders", async () => {
  const renderCircuit = async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board>
        <group subcircuit>
          <resistor
            name="R1"
            resistance="10k"
            footprint="0402"
            pcbX={-2}
            pcbY={0}
          />
          <resistor
            name="R2"
            resistance="10k"
            footprint="0402"
            pcbX={2}
            pcbY={0}
          />
          <net name="VCC" />
          <net name="GND" />
          <trace from=".R1 > .pin1" to="net.VCC" />
          <trace from=".R2 > .pin1" to="net.VCC" />
          <trace from=".R1 > .pin2" to="net.GND" />
          <trace from=".R2 > .pin2" to="net.GND" />
        </group>
        <group subcircuit>
          <resistor
            name="R3"
            resistance="22k"
            footprint="0402"
            pcbX={-2}
            pcbY={4}
          />
          <resistor
            name="R4"
            resistance="22k"
            footprint="0402"
            pcbX={2}
            pcbY={4}
          />
          <net name="SIG" />
          <net name="REF" />
          <trace from=".R3 > .pin1" to="net.SIG" />
          <trace from=".R4 > .pin1" to="net.SIG" />
          <trace from=".R3 > .pin2" to="net.REF" />
          <trace from=".R4 > .pin2" to="net.REF" />
        </group>
      </board>,
    )

    circuit.render()

    const schematicSvg = await circuit.getSvg({ view: "schematic" })
    const schematicKeys = Array.from(
      new Set(
        [
          ...schematicSvg.matchAll(
            /data-subcircuit-connectivity-map-key="([^"]+)"/g,
          ),
        ].map((match) => match[1]),
      ),
    ).sort()

    return {
      sourceGroup: circuit.db.source_group.list(),
      traceKeys: circuit.db.source_trace
        .list()
        .map((trace) => trace.subcircuit_connectivity_map_key),
      portKeys: circuit.db.source_port.list().map((port) => ({
        name: port.name,
        key: port.subcircuit_connectivity_map_key,
      })),
      netKeys: circuit.db.source_net.list().map((net) => ({
        name: net.name,
        key: net.subcircuit_connectivity_map_key,
      })),
      schematicKeys,
    }
  }

  const firstRender = await renderCircuit()
  const secondRender = await renderCircuit()

  expect(firstRender).toEqual(secondRender)

  expect(firstRender).toMatchInlineSnapshot(`
{
  "netKeys": [
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
      "name": "VCC",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net1",
      "name": "GND",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net0",
      "name": "SIG",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net1",
      "name": "REF",
    },
  ],
  "portKeys": [
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
      "name": "pin1",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net1",
      "name": "pin2",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
      "name": "pin1",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net1",
      "name": "pin2",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net0",
      "name": "pin1",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net1",
      "name": "pin2",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net0",
      "name": "pin1",
    },
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net1",
      "name": "pin2",
    },
  ],
  "schematicKeys": [
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net1",
    "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net0",
    "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net1",
  ],
  "sourceGroup": [
    {
      "is_subcircuit": true,
      "name": undefined,
      "parent_source_group_id": "source_group_2",
      "parent_subcircuit_id": "subcircuit_source_group_2",
      "source_group_id": "source_group_0",
      "subcircuit_id": "subcircuit_source_group_0",
      "type": "source_group",
      "was_automatically_named": true,
    },
    {
      "is_subcircuit": true,
      "name": undefined,
      "parent_source_group_id": "source_group_2",
      "parent_subcircuit_id": "subcircuit_source_group_2",
      "source_group_id": "source_group_1",
      "subcircuit_id": "subcircuit_source_group_1",
      "type": "source_group",
      "was_automatically_named": true,
    },
    {
      "is_subcircuit": true,
      "name": undefined,
      "source_group_id": "source_group_2",
      "subcircuit_id": "subcircuit_source_group_2",
      "type": "source_group",
      "was_automatically_named": true,
    },
  ],
  "traceKeys": [
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net1",
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net1",
    "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net0",
    "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net0",
    "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net1",
    "unnamedsubcircuitsubcircuit_source_group_1_connectivity_net1",
  ],
}
`)
})
