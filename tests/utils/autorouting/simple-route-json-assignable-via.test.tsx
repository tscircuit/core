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
      <testpoint
        name="TP_TOP"
        footprintVariant="pad"
        pcbX={0}
        pcbY={0}
        layer="top"
      />
      <testpoint
        name="TP_BOTTOM"
        footprintVariant="pad"
        pcbX={0}
        pcbY={8}
        layer="bottom"
      />
      <via
        name="V_ASSIGNABLE"
        pcbX={0}
        pcbY={4}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        netIsAssignable
      />
      <trace from="TP_TOP.pin1" to="V_ASSIGNABLE.top" />
      <trace from="V_ASSIGNABLE.bottom" to="TP_BOTTOM.pin1" />
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
