import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { Fragment } from "react"
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

test("each breakout phase receives only its component obstacles and local pours", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })
  const breakoutInputs: Record<string, SimpleRouteJson> = {}
  let globalInput: SimpleRouteJson | undefined

  const createBreakoutAutorouter = (breakoutName: string) =>
    createBasicAutorouter(async (simpleRouteJson) => {
      breakoutInputs[breakoutName] = structuredClone(simpleRouteJson)
      return routeConnectionsDirectly(simpleRouteJson, breakoutName)
    })
  const globalAutorouter = createBasicAutorouter(async (simpleRouteJson) => {
    globalInput = structuredClone(simpleRouteJson)
    return routeConnectionsDirectly(simpleRouteJson, "global")
  })

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
  const leftInput = breakoutInputs.left
  const rightInput = breakoutInputs.right
  expect(leftInput).toBeDefined()
  expect(rightInput).toBeDefined()
  expect(globalInput).toBeDefined()
  if (!leftInput || !rightInput || !globalInput) {
    throw new Error("Expected both breakout inputs and the global input")
  }
  const getPcbComponentId = (sourceComponentName: string) => {
    const sourceComponent = circuit.db.source_component.getWhere({
      name: sourceComponentName,
    })
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent?.source_component_id,
    })
    expect(pcbComponent).toBeDefined()
    return pcbComponent!.pcb_component_id
  }
  const u1PcbComponentId = getPcbComponentId("U1")
  const u2PcbComponentId = getPcbComponentId("U2")
  const unrelatedPcbComponentId = getPcbComponentId("UNRELATED")
  const getObstacleComponentIds = (simpleRouteJson: SimpleRouteJson) =>
    new Set(
      simpleRouteJson.obstacles.flatMap((obstacle) =>
        obstacle.componentId ? [obstacle.componentId] : [],
      ),
    )
  expect(getObstacleComponentIds(leftInput)).toEqual(
    new Set([u1PcbComponentId]),
  )
  expect(getObstacleComponentIds(rightInput)).toEqual(
    new Set([u2PcbComponentId]),
  )
  expect(getObstacleComponentIds(globalInput)).toEqual(
    new Set([u1PcbComponentId, u2PcbComponentId, unrelatedPcbComponentId]),
  )

  for (const [simpleRouteJson, expectedCenterX] of [
    [leftInput, -10],
    [rightInput, 10],
  ] as const) {
    const copperPourObstacles = simpleRouteJson.obstacles.filter(
      (obstacle) => obstacle.isCopperPour,
    )
    expect(copperPourObstacles).toHaveLength(2)
    expect(copperPourObstacles.map((obstacle) => obstacle.layers)).toEqual([
      ["inner1"],
      ["inner2"],
    ])
    expect(
      copperPourObstacles.every(
        (obstacle) =>
          obstacle.center.x === expectedCenterX &&
          obstacle.center.y === 0 &&
          obstacle.width === 8 &&
          obstacle.height === 8,
      ),
    ).toBe(true)
  }
  const globalCopperPourObstacles = globalInput.obstacles.filter(
    (obstacle) => obstacle.isCopperPour,
  )
  expect(globalCopperPourObstacles).toHaveLength(2)
  expect(
    globalCopperPourObstacles.every(
      (obstacle) =>
        obstacle.center.x === 0 &&
        obstacle.center.y === 0 &&
        obstacle.width === 50 &&
        obstacle.height === 20,
    ),
  ).toBe(true)

  expect(leftInput.traces ?? []).toHaveLength(0)
  expect(rightInput.traces ?? []).toHaveLength(0)
  expect(globalInput.traces).toHaveLength(4)
  expect(leftInput.connections).toHaveLength(2)
  expect(rightInput.connections).toHaveLength(2)
  expect(leftInput.buses?.[0]?.connectionNames).toHaveLength(2)
  expect(rightInput.buses?.[0]?.connectionNames).toHaveLength(2)
  expect(
    Object.keys(leftInput.buses?.[0]?.connectionExitTargets ?? {}),
  ).toHaveLength(2)
  expect(
    Object.keys(rightInput.buses?.[0]?.connectionExitTargets ?? {}),
  ).toHaveLength(2)
  expect(leftInput.layerCount).toBe(4)
  expect(rightInput.layerCount).toBe(4)
})
