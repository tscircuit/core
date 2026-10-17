import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton with 4-pin footprint emits default internal pin connections (#3115)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton name="SW1" footprint="pushbutton" />
    </board>,
  )

  circuit.render()

  const sourcePorts = circuit.db.source_port.list()
  expect(sourcePorts.map((p) => p.name)).toEqual([
    "pin1",
    "pin2",
    "pin3",
    "pin4",
  ])

  const portIdByName = new Map(
    sourcePorts.map((p) => [p.name, p.source_port_id]),
  )

  const internalConnections =
    circuit.db.source_component_internal_connection.list()
  expect(internalConnections).toHaveLength(2)
  expect(internalConnections.map((ic) => ic.source_port_ids)).toEqual([
    [portIdByName.get("pin1")!, portIdByName.get("pin2")!],
    [portIdByName.get("pin3")!, portIdByName.get("pin4")!],
  ])

  const sourceComponent = circuit.db.source_component.list()[0]
  expect(sourceComponent?.internally_connected_source_port_ids).toEqual([
    [portIdByName.get("pin1")!, portIdByName.get("pin2")!],
    [portIdByName.get("pin3")!, portIdByName.get("pin4")!],
  ])
})
