import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro155: redundant connections to internally connected pushbutton pins remain visible", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board schMaxTraceDistance={1}>
      <schematictext
        text="Expected: SIGNAL and GND net labels are visible at SW1"
        fontSize={0.2}
        schX={0}
        schY={2}
      />
      <pushbutton
        name="SW1"
        schX={0}
        pinLabels={{
          pin1: "pin1",
          pin2: "pin2",
          pin3: "pin3",
          pin4: "pin4",
        }}
        internallyConnectedPins={[
          ["pin1", "pin3"],
          ["pin2", "pin4"],
        ]}
        connections={{
          pin1: "net.SIGNAL",
          pin3: "net.SIGNAL",
          pin2: "net.GND",
          pin4: "net.GND",
        }}
        footprint="pushbutton_id1.3mm_od2mm"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(4)
  expect(
    circuit.db.schematic_net_label
      .list()
      .map((label) => label.text)
      .sort(),
  ).toEqual(["GND", "SIGNAL"])
  const gndLabel = circuit.db.schematic_net_label
    .list()
    .find((label) => label.text === "GND")!
  const gndSourceNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "GND")!
  const gndTrace = circuit.db.schematic_trace
    .list()
    .find(
      (trace) =>
        trace.subcircuit_connectivity_map_key ===
        gndSourceNet.subcircuit_connectivity_map_key,
    )!
  expect(gndTrace.edges.at(-1)?.to).toEqual(gndLabel.anchor_position)
  expect(circuit.db.schematic_port.list()).toHaveLength(4)
  const gndInternalConnection = circuit.db.source_component_internal_connection
    .list()
    .find((connection) =>
      connection.source_port_ids.some(
        (sourcePortId) =>
          circuit.db.source_port.get(sourcePortId)?.name === "pin2",
      ),
    )!
  const gndSchematicPorts = circuit.db.schematic_port
    .list()
    .filter(
      (port) =>
        port.source_port_id &&
        gndInternalConnection.source_port_ids.includes(port.source_port_id),
    )
  expect(gndSchematicPorts.every((port) => port.is_connected)).toBe(true)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
