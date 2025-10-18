import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("simple route json uses subcircuit padding", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <group name="G1" subcircuit pcbLayout={{ padding: 10 }}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
    </group>,
  )

  await circuit.renderUntilSettled()

  const subcircuitId = circuit.db.source_group.list()[0].subcircuit_id!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: subcircuitId,
  })
  const group = circuit.db.pcb_group.getWhere({ subcircuit_id: subcircuitId })!

  const routeWidth = simpleRouteJson.bounds.maxX - simpleRouteJson.bounds.minX
  const routeHeight = simpleRouteJson.bounds.maxY - simpleRouteJson.bounds.minY

  expect(routeWidth).toBeCloseTo(group.width!, 1)
  expect(routeHeight).toBeCloseTo(group.height!, 1)
})
