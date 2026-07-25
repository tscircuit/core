import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple route json bounds include post-pack component positions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={30} height={30} routingDisabled>
      <subcircuit name="S1" pcbLayout={{ padding: 1 }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="2k" footprint="0402" />
        <resistor name="R3" resistance="3k" footprint="0402" />
      </subcircuit>
      <pcbnotetext
        pcbX={0}
        pcbY={10}
        text="SRJ bounds include all auto-packed components"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceGroup = circuit.db.source_group.getWhere({ name: "S1" })!
  const pcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: sourceGroup.source_group_id,
  })!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuit_id: sourceGroup.subcircuit_id,
  })

  expect(simpleRouteJson.bounds).toEqual({
    minX: pcbGroup.center.x - pcbGroup.width! / 2,
    maxX: pcbGroup.center.x + pcbGroup.width! / 2,
    minY: pcbGroup.center.y - pcbGroup.height! / 2,
    maxY: pcbGroup.center.y + pcbGroup.height! / 2,
  })

  for (const obstacle of simpleRouteJson.obstacles) {
    expect(obstacle.center.x - obstacle.width / 2).toBeGreaterThanOrEqual(
      simpleRouteJson.bounds.minX,
    )
    expect(obstacle.center.x + obstacle.width / 2).toBeLessThanOrEqual(
      simpleRouteJson.bounds.maxX,
    )
    expect(obstacle.center.y - obstacle.height / 2).toBeGreaterThanOrEqual(
      simpleRouteJson.bounds.minY,
    )
    expect(obstacle.center.y + obstacle.height / 2).toBeLessThanOrEqual(
      simpleRouteJson.bounds.maxY,
    )
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
