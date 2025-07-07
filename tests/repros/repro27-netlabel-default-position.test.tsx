import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Port } from "lib/components/primitive-components/Port/Port"

// Reproduction for netlabel default anchor position when connected to a schematic port

test("netlabel defaults anchor to connected port position", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <netlabel net="A" connection="R1.pin1" />
    </board>,
  )

  circuit.render()

  const port = circuit.selectOne("resistor.R1 > port.1") as Port
  const portPos = port._getGlobalSchematicPositionAfterLayout()
  const label = circuit.db.schematic_net_label.list()[0]
  expect(label.anchor_position).toEqual(portPos)
})
