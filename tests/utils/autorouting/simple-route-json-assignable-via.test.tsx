import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

// This test ensures that vias marked as assignable produce obstacles
// with the netIsAssignable flag so the autorouter can claim them
// for nets as needed.
test("assignable vias produce assignable obstacles", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" autorouter="laser_prefab">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R1 > .pin2" />
      <via
        pcbX={1}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        netIsAssignable
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  const assignableViaObstacle = simpleRouteJson.obstacles.find(
    (obstacle) => obstacle.netIsAssignable,
  )

  expect(assignableViaObstacle).toBeDefined()
  expect(assignableViaObstacle?.netIsAssignable).toBe(true)
})
