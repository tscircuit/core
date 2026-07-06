import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// The board-level autorouter `traceClearance` is surfaced to the capacity
// autorouter via SimpleRouteJson.defaultObstacleMargin, which sets the
// trace-to-obstacle spacing. Before this it was dropped and the clearance
// could not be configured.
test("getSimpleRouteJsonFromCircuitJson forwards defaultObstacleMargin", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" />
      <trace from="R1.pin1" to="C1.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit
    .getCircuitJson()
    .filter((elm) => elm.type !== "pcb_trace")

  const { simpleRouteJson: withMargin } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    defaultObstacleMargin: 0.3,
  })
  expect(withMargin.defaultObstacleMargin).toBe(0.3)

  const { simpleRouteJson: withoutMargin } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
  })
  expect(withoutMargin.defaultObstacleMargin).toBeUndefined()
})
