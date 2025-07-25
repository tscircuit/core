import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { su } from "@tscircuit/circuit-json-util"

// Reproduction for netlabel default anchor position when connected to a schematic port

test("netlabel defaults anchor to connected port position", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      routingDisabled
      schLayout={{ layoutMode: "none" }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" />
      <netlabel net="A" connection="R1.pin1" />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const sourcePort = su(circuitJson).source_port.getWhere({ name: "pin1" })!
  const schPort = su(circuitJson).schematic_port.getWhere({
    source_port_id: sourcePort.source_port_id,
  })!
  const label = su(circuitJson).schematic_net_label.list()[0]

  expect(label.anchor_position).toEqual(schPort.center)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
