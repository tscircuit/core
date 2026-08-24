import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createBgaPads = () =>
  Array.from({ length: 4 }, (_, padIndex) => {
    const pinNumber = padIndex + 1
    return (
      <Fragment key={pinNumber}>
        <smtpad
          portHints={[`pin${pinNumber}`]}
          pcbX={(padIndex % 2) * 0.8 - 0.4}
          pcbY={Math.floor(padIndex / 2) * 0.8 - 0.4}
          shape="circle"
          radius="0.175mm"
        />
      </Fragment>
    )
  })

const routeConnectionsDirectly = (
  simpleRouteJson: SimpleRouteJson,
  traceIdPrefix: string,
): SimplifiedPcbTrace[] =>
  simpleRouteJson.connections.map((connection, connectionIndex) => ({
    type: "pcb_trace",
    pcb_trace_id: `${traceIdPrefix}_${connectionIndex}`,
    connection_name: connection.source_trace_id ?? connection.name,
    route: connection.pointsToConnect.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      width: connection.nominalTraceWidth ?? 0.1,
      layer: point.layer,
    })),
  }))

test("custom breakout phases use their active copper-pour bounds", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const breakoutInputs = new Map<string, SimpleRouteJson>()
  const createBreakoutAutorouter = (breakoutName: string) =>
    createBasicAutorouter(async (simpleRouteJson) => {
      breakoutInputs.set(breakoutName, structuredClone(simpleRouteJson))
      return routeConnectionsDirectly(simpleRouteJson, breakoutName)
    })
  const globalAutorouter = createBasicAutorouter(async (simpleRouteJson) =>
    routeConnectionsDirectly(simpleRouteJson, "global"),
  )

  circuit.add(
    <board
      width="50mm"
      height="20mm"
      layers={4}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      autorouter={{ algorithmFn: globalAutorouter }}
    >
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <copperpour layer="inner2" connectsTo="net.GND" unbroken />

      <breakout
        name="LEFT_BREAKOUT"
        pcbX={-10}
        width="8mm"
        height="8mm"
        autorouter={{ algorithmFn: createBreakoutAutorouter("left") }}
      >
        <chip name="U1" footprint={<footprint>{createBgaPads()}</footprint>} />
      </breakout>

      <breakout
        name="RIGHT_BREAKOUT"
        pcbX={10}
        width="8mm"
        height="8mm"
        autorouter={{ algorithmFn: createBreakoutAutorouter("right") }}
      >
        <chip name="U2" footprint={<footprint>{createBgaPads()}</footprint>} />
      </breakout>

      <resistor
        name="UNRELATED"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={7}
      />
      <trace name="DATA0" from="U1.pin1" to="U2.pin1" />
      <trace name="DATA1" from="U1.pin2" to="U2.pin2" />
      <bus name="DATA" connections={["DATA0", "DATA1"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const leftInput = breakoutInputs.get("left")
  const rightInput = breakoutInputs.get("right")
  expect(leftInput).toBeDefined()
  expect(rightInput).toBeDefined()
  const getCopperPourBounds = (simpleRouteJson: SimpleRouteJson | undefined) =>
    simpleRouteJson?.obstacles
      .filter((obstacle) => obstacle.isCopperPour)
      .map((obstacle) => ({
        center: obstacle.center,
        width: obstacle.width,
        height: obstacle.height,
        layers: obstacle.layers,
      }))
  expect(getCopperPourBounds(leftInput)).toEqual([
    {
      center: { x: -10, y: 0 },
      width: 8,
      height: 8,
      layers: ["inner1"],
    },
    {
      center: { x: -10, y: 0 },
      width: 8,
      height: 8,
      layers: ["inner2"],
    },
  ])
  expect(getCopperPourBounds(rightInput)).toEqual([
    {
      center: { x: 10, y: 0 },
      width: 8,
      height: 8,
      layers: ["inner1"],
    },
    {
      center: { x: 10, y: 0 },
      width: 8,
      height: 8,
      layers: ["inner2"],
    },
  ])
  expect(
    leftInput?.obstacles
      .filter((obstacle) => !obstacle.isCopperPour)
      .map((obstacle) => obstacle.obstacleId),
  ).toEqual(
    rightInput?.obstacles
      .filter((obstacle) => !obstacle.isCopperPour)
      .map((obstacle) => obstacle.obstacleId),
  )
  expect(rightInput?.traces).toHaveLength(2)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "active-breakout-copper-pour-bounds-autorouting-srj",
    circuit,
  )
})
