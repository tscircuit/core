import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Unbroken copper pours have two routing roles, split by layer:
//
// - OUTER-layer pours (top/bottom) are conforming ground fills: filled AFTER
//   routing, flowing around the routed traces (see CopperPour's
//   get-trace-obstacles / generate-and-insert-brep). They do not exist as copper
//   at routing time, so they must NOT become hard routing obstacles - a 2-layer
//   board fully covered by a GND pour would otherwise be unroutable.
//
// - INNER-layer pours are solid planes reached by escape vias and keep the
//   pre-existing behavior: emitted as obstacles so the escape-via machinery can
//   target them, with their nets still routed.
test("outer-layer copper pours are not routing obstacles, inner-layer pours are", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" layers={4}>
      <copperpour layer="top" connectsTo="net.GND" unbroken />
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <copperpour layer="inner2" connectsTo="net.VCC" />
      <chip
        footprint="soic10"
        name="U1"
        connections={{
          pin2: "net.GND",
          pin3: "net.VCC",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.firstChild as {
    selectAll(selector: string): unknown[]
  }
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
    subcircuitComponent: board,
  })

  const copperPourObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) => obstacle.isCopperPour,
  )
  const outerPourObstacles = copperPourObstacles.filter((o) =>
    o.layers.some((l) => l === "top" || l === "bottom"),
  )
  const innerPourObstacles = copperPourObstacles.filter(
    (o) => !o.layers.some((l) => l === "top" || l === "bottom"),
  )

  expect(outerPourObstacles.length).toBe(0)
  expect(innerPourObstacles.length).toBeGreaterThan(0)
})
