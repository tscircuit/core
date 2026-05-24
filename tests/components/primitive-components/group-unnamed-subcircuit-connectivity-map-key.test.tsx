import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unnamed subcircuit connectivity map keys are deterministic across renders", async () => {
  const renderCircuit = async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <group subcircuit>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <net name="VCC" />
        <trace from=".R1 > .pin1" to="net.VCC" />
      </group>,
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
  ],
  "portKeys": [
    {
      "key": "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
      "name": "pin1",
    },
    {
      "key": undefined,
      "name": "pin2",
    },
  ],
  "schematicKeys": [
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
  ],
  "sourceGroup": [
    {
      "is_subcircuit": true,
      "name": undefined,
      "source_group_id": "source_group_0",
      "subcircuit_id": "subcircuit_source_group_0",
      "type": "source_group",
      "was_automatically_named": true,
    },
  ],
  "traceKeys": [
    "unnamedsubcircuitsubcircuit_source_group_0_connectivity_net0",
  ],
}
`)
})
