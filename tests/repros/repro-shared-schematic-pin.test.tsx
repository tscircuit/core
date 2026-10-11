import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinNames = ["A", "B", "C", "D", "E", "F"]
const edges = [
  ["A", "B"],
  ["C", "D"],
  ["E", "F"],
  ["C", "E"],
  ["A", "D"],
]

test.failing("shared schematic pins preserve every logical connection", async () => {
  for (const namedEdges of [true, false]) {
    const { circuit } = getTestFixture()
    circuit.pcbDisabled = true
    circuit.add(
      <board>
        <schematictext
          text="PASS: core preserves all five connections through shared pins"
          schX={0}
          schY={2.2}
          fontSize={0.18}
        />
        <chip
          name="U1"
          schWidth={3}
          schHeight={2}
          pinLabels={Object.fromEntries(
            pinNames.map((name, i) => [`pin${i + 1}`, name]),
          )}
          connections={{ A: "net.V3V3", C: "net.V3V3", E: "net.V3V3" }}
        />
        {edges.map(([from, to], i) => (
          <trace
            key={i}
            name={namedEdges ? `EDGE_${i}` : undefined}
            from={`.U1 > .${from}`}
            to={`.U1 > .${to}`}
          />
        ))}
      </board>,
    )
    await circuit.renderUntilSettled()

    const ports = circuit.db.source_port.list()
    const net = circuit.db.source_net.getWhere({ name: "V3V3" })!
    expect(ports.map((port) => port.name).sort()).toEqual(pinNames)
    expect(
      ports.every(
        (port) =>
          port.subcircuit_connectivity_map_key ===
          net.subcircuit_connectivity_map_key,
      ),
    ).toBe(true)
    for (const [from, to] of edges) {
      const sourcePortIds = [from, to]
        .map((name) => ports.find((port) => port.name === name)!.source_port_id)
        .sort()
      expect(
        circuit.db.source_trace
          .list()
          .some(
            (trace) =>
              trace.connected_source_port_ids.toSorted().join() ===
              sourcePortIds.join(),
          ),
      ).toBe(true)
    }
    expect(
      circuit.db.schematic_port.list().every((port) => port.is_connected),
    ).toBe(true)
    await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
      colorOverrides: { schematic: { background: "white" } },
      width: 900,
      height: 500,
    })
  }
})
