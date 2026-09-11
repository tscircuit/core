import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro duplicate obstacle connectivity aliases on shared power nets", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbRoutingDisabled = true
  circuit.add(
    <board width={20} height={10} layers={4} schAutoLayoutEnabled>
      <net name="GND" />
      <net name="VBAT" />
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={-3}
        connections={{ pin1: "net.VBAT", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0603"
        pcbX={3}
        connections={{ pin1: "net.VBAT", pin2: "net.GND" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: circuit.firstChild!,
  })
  const ground = circuit.db.source_net.list().find((net) => net.name === "GND")!
  const supply = circuit.db.source_net
    .list()
    .find((net) => net.name === "VBAT")!
  const groundObstacles = simpleRouteJson.obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes(ground.source_net_id),
  )
  expect(groundObstacles.length).toBeGreaterThanOrEqual(3)
  for (const obstacle of groundObstacles) {
    expect(obstacle.connectedTo).not.toContain(supply.source_net_id)
  }
  for (const obstacle of simpleRouteJson.obstacles) {
    expect(obstacle.connectedTo.length).toBe(new Set(obstacle.connectedTo).size)
  }
  expect(
    simpleRouteJson.obstacles.map((obstacle) => ({
      entries: obstacle.connectedTo.length,
      uniqueEntries: new Set(obstacle.connectedTo).size,
    })),
  ).toEqual([
    {
      entries: 10,
      uniqueEntries: 10,
    },
    {
      entries: 10,
      uniqueEntries: 10,
    },
    {
      entries: 10,
      uniqueEntries: 10,
    },
    {
      entries: 10,
      uniqueEntries: 10,
    },
    {
      entries: 11,
      uniqueEntries: 11,
    },
  ])
})
