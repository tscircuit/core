import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip schPinLength controls schematic box pin stem length", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        schX={8}
        schY={8}
        schWidth={2}
        schHeight={2}
        schPinArrangement={{ leftSize: 1, rightSize: 1 }}
        pinLabels={{ pin1: "A", pin2: "B" }}
        {...({ schPinLength: 1 } as any)}
      />
    </board>,
  )

  circuit.render()

  const sourceComponent = circuit.db.source_component.getWhere({ name: "U1" })
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: sourceComponent?.source_component_id,
  })
  expect(schematicComponent?.center).toEqual({ x: 8, y: 8 })

  const ports = circuit.db.schematic_port
    .list({
      schematic_component_id: schematicComponent?.schematic_component_id,
    })
    .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))

  expect(ports).toHaveLength(2)
  expect(ports[0].center.x).toBe(6)
  expect(ports[0].center.y).toBe(8)
  expect(ports[0].distance_from_component_edge).toBe(1)
  expect(ports[1].center.x).toBe(10)
  expect(ports[1].center.y).toBe(8)
  expect(ports[1].distance_from_component_edge).toBe(1)
})
