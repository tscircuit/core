import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createInternalCircuit = () => (
  <internalcircuit>
    {/* Isolated rendering must not escape the internal circuit's physical boundary. */}
    <group _subcircuitCachingEnabled>
      <resistor
        name="A"
        resistance="1k"
        schX={-1}
        connections={{
          pin1: "pin.IN",
          pin2: "B.pin1",
        }}
      />
      <resistor
        name="B"
        resistance="2k"
        schX={1}
        connections={{
          pin2: "pin.OUT",
        }}
      />
    </group>
  </internalcircuit>
)

test("internalCircuit resolves local component selectors within each package", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm" routingDisabled>
      <chip
        name="U1"
        footprint="sot23"
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "NC" }}
        noConnect={["NC"]}
        pcbX={-4}
        schX={-4}
        connections={{ IN: "net.IN_1", OUT: "net.OUT_1" }}
        internalCircuit={createInternalCircuit()}
      />
      <chip
        name="U2"
        footprint="sot23"
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "NC" }}
        noConnect={["NC"]}
        pcbX={4}
        schX={4}
        connections={{ IN: "net.IN_2", OUT: "net.OUT_2" }}
        internalCircuit={createInternalCircuit()}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const sourceComponentNameBySourcePortId = new Map(
    circuit.db.source_port
      .list()
      .map((sourcePort) => [
        sourcePort.source_port_id,
        sourcePort.source_component_id
          ? (circuit.db.source_component.get(sourcePort.source_component_id)
              ?.name ?? "")
          : "",
      ]),
  )
  const connectedComponentPairs = circuit.db.source_trace
    .list()
    .filter((sourceTrace) => sourceTrace.connected_source_port_ids.length === 2)
    .map((sourceTrace) =>
      sourceTrace.connected_source_port_ids
        .map(
          (sourcePortId) =>
            sourceComponentNameBySourcePortId.get(sourcePortId) ?? "",
        )
        .sort()
        .join("-"),
    )
    .sort()

  expect(connectedComponentPairs).toEqual([
    "U1-U1A",
    "U1-U1B",
    "U1A-U1B",
    "U2-U2A",
    "U2-U2B",
    "U2A-U2B",
  ])
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_component.list()).toHaveLength(2)
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)
})
