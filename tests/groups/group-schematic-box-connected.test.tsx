import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group schematic box connected to external component", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <group name="G1" showAsSchematicBox>
        <port name="OUT" direction="left" />
        <resistor name="R_INTERNAL" resistance="1k" footprint="0402" />
      </group>
      <resistor
        name="R_OUT"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: "G1.OUT" }}
      />
    </board>,
  )

  circuit.render()

  const sourceGroup = circuit.db.source_group.getWhere({ name: "G1" })
  const groupSchematicComponent = circuit.db.schematic_component.getWhere({
    source_group_id: sourceGroup?.source_group_id,
  })
  expect(groupSchematicComponent).toBeDefined()

  const schematicPort = circuit.db.schematic_port.getWhere({
    schematic_component_id: groupSchematicComponent!.schematic_component_id,
  })
  expect(schematicPort?.is_connected).toBe(true)

  const terminal = schematicPort!.center
  const approaches = circuit.db.schematic_trace.list().flatMap((trace) =>
    trace.edges.flatMap((edge) => {
      if (Math.hypot(edge.from.x - terminal.x, edge.from.y - terminal.y) < 1e-8)
        return [edge.to]
      if (Math.hypot(edge.to.x - terminal.x, edge.to.y - terminal.y) < 1e-8)
        return [edge.from]
      return []
    }),
  )
  expect(approaches).toHaveLength(1)
  // The emitted terminal faces left and extends beyond the body rectangle.
  // Cleanup must meet it from outside, without folding back along its stem.
  expect(approaches[0]!.x).toBeLessThan(terminal.x)
  expect(approaches[0]!.y).toBeCloseTo(terminal.y)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
