import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a fixed-width pair uses its escape hints even at the board default width", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} defaultTraceWidth={0.3} routingDisabled>
      <pinheader name="A" pinCount={2} pcbX={-5} />
      <pinheader name="B" pinCount={2} pcbX={5} />
      <trace name="fixed" from="A.pin1" to="B.pin1" thickness={0.3} />
      <trace name="automatic" from="A.pin2" to="B.pin2" />
      <tracehint for="B.pin1" offset={{ x: 0, y: 1 }} />
      <tracehint for="B.pin1" offset={{ x: -1, y: 1 }} />
      <tracehint for="A.pin1" offset={{ x: 0, y: -1 }} />
    </board>,
  )
  circuit.render()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  const [fixed, automatic] = simpleRouteJson.connections
  expect(automatic.path).toBeUndefined()
  expect(automatic.nominalTraceWidth).toBe(0.3)
  const [a, b] = [fixed.pointsToConnect[0], fixed.pointsToConnect.at(-1)!]
  const path = fixed.path!.map((id) => {
    const point = fixed.pointsToConnect.find((port) => port.pointId === id)!
    return [point.x, point.y]
  })
  expect(path).toEqual([
    [a.x, a.y],
    [0, -1],
    [-1, 1],
    [0, 1],
    [b.x, b.y],
  ])
})
