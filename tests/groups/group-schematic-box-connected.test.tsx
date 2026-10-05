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

  const portCenter = schematicPort!.center
  const terminalEdges = circuit.db.schematic_trace
    .list()
    .flatMap((trace) =>
      trace.edges.filter((edge) =>
        [edge.from, edge.to].some(
          (point) =>
            Math.abs(point.x - portCenter.x) < 1e-9 &&
            Math.abs(point.y - portCenter.y) < 1e-9,
        ),
      ),
    )
  expect(terminalEdges).toHaveLength(1)
  const terminalEdge = terminalEdges[0]!
  const approach =
    Math.abs(terminalEdge.from.x - portCenter.x) < 1e-9 &&
    Math.abs(terminalEdge.from.y - portCenter.y) < 1e-9
      ? terminalEdge.to
      : terminalEdge.from
  expect(approach.x).toBeLessThan(portCenter.x)
  expect(approach.y).toBeCloseTo(portCenter.y, 9)

  expect(circuit.db.schematic_trace.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
