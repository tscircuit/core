import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("pill rotations in simple route json", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              layer="top"
              width="2mm"
              height="1mm"
              radius="0.5mm"
              portHints={["1"]}
            />
          </footprint>
        }
        pcbRotation={45}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pillPad = circuit.db.pcb_smtpad.list()[0]

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  const pillObstacle = simpleRouteJson.obstacles.find((obstacle) =>
    obstacle.connectedTo.includes(pillPad.pcb_smtpad_id),
  )

  expect(pillObstacle?.type).toBe("rect")
  expect(pillObstacle?.ccwRotationDegrees).toBe(45)
})
