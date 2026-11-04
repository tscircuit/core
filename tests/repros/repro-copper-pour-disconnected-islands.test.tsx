import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("disconnected same-net pours still need a route between islands", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} routingDisabled>
      <net name="GND" />
      {[-5, -2, 2, 5].map((pcbX, index) => (
        <testpoint
          key={pcbX}
          name={String.fromCharCode(65 + index)}
          footprintVariant="pad"
          pcbX={pcbX}
          padDiameter={1}
          connections={{ pin1: "net.GND" }}
        />
      ))}
      {[-3.5, 3.5].map((centerX) => (
        <Fragment key={centerX}>
          <copperpour
            connectsTo="net.GND"
            layer="top"
            outline={[
              { x: centerX - 2.5, y: -2 },
              { x: centerX + 2.5, y: -2 },
              { x: centerX + 2.5, y: 2 },
              { x: centerX - 2.5, y: 2 },
            ]}
          />
        </Fragment>
      ))}
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.5}
        text="GND: A + B joined; C + D joined"
      />
      <pcbnotetext
        pcbY={-3.5}
        fontSize={0.5}
        text="One route is still needed across the gap"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const connection = simpleRouteJson.connections[0]!
  expect(connection.externallyConnectedPointIds).toEqual([
    connection.pointsToConnect
      .filter((point) => point.x < 0)
      .map((point) => point.pointId!),
    connection.pointsToConnect
      .filter((point) => point.x > 0)
      .map((point) => point.pointId!),
  ])
  const router = new AutoroutingPipelineSolver({
    ...simpleRouteJson,
    traces: [],
  })
  while (!router.srjWithPointPairs && !router.failed && !router.solved) {
    router.step()
  }
  expect(router.failed).toBe(false)
  expect(router.srjWithPointPairs!.connections).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbNotes: true })
})
