import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<pushbutton /> creates traces for externally connected pins", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        externallyConnectedPins={[["pin1", "pin2"]]}
      />
    </board>,
  )

  circuit.render()

  const sourceTraces = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "source_trace")

  expect(sourceTraces).toHaveLength(1)
  const sourcePortsById = new Map(
    circuit.db.source_port
      .list()
      .map((sourcePort) => [sourcePort.source_port_id, sourcePort]),
  )
  expect(
    sourceTraces[0].connected_source_port_ids.map(
      (sourcePortId) => sourcePortsById.get(sourcePortId)?.name,
    ),
  ).toEqual(["pin1", "pin2"])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
