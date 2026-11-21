import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("SRJ preserves via-only constraints without turning advisory zones into obstacles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={20} routingDisabled>
      <keepout
        shape="rect"
        width={2}
        height={3}
        pcbX={-5}
        allowTraces
        layers={["bottom"]}
      />
      <keepout shape="circle" radius={1} pcbX={5} allowTraces allowPlacements />
      <keepout
        shape="rect"
        width={2}
        height={2}
        pcbY={5}
        allowTraces
        warningOnly
      />
      <keepout shape="rect" width={2} height={2} pcbY={-5} allowPlacements />
    </board>,
  )
  await circuit.renderUntilSettled()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })
  expect(simpleRouteJson.viaKeepouts).toEqual([
    {
      shape: "rect",
      center: { x: -5, y: 0 },
      width: 2,
      height: 3,
      layers: ["bottom"],
    },
    { shape: "circle", center: { x: 5, y: 0 }, radius: 1, layers: ["top"] },
  ])
  expect(simpleRouteJson.obstacles).toHaveLength(1)
  expect(simpleRouteJson.obstacles[0].center).toEqual({ x: 0, y: -5 })
})
