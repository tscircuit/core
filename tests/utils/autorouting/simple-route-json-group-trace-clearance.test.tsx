import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("uses group clearance and honors an explicit routing clearance", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <group name="G1" subcircuit autorouter={{ traceClearance: "0.3mm" }}>
        <resistor name="R1" resistance="1k" footprint="0805" />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const group = circuit.db.pcb_group.getWhere({ name: "G1" })!
  const input = { circuitJson, subcircuit_id: group.subcircuit_id }
  expect(
    getSimpleRouteJsonFromCircuitJson(input).simpleRouteJson
      .defaultObstacleMargin,
  ).toBe(0.3)
  expect(
    getSimpleRouteJsonFromCircuitJson({ ...input, defaultObstacleMargin: 0.2 })
      .simpleRouteJson.defaultObstacleMargin,
  ).toBe(0.2)
  expect(
    getSimpleRouteJsonFromCircuitJson({ circuitJson }).simpleRouteJson
      .defaultObstacleMargin,
  ).toBeUndefined()
})
