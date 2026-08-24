import { expect, test } from "bun:test"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import { Group_syncFanoutExitsWithGlobalConnections } from "lib/components/primitive-components/Group/Group_syncFanoutExitsWithGlobalConnections"
import type {
  Obstacle,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"

const bounds = { minX: -5, maxX: 5, minY: -5, maxY: 5 }

const createSimpleRouteJson = (obstacles: Obstacle[]): SimpleRouteJson => ({
  layerCount: 2,
  minTraceWidth: 0.1,
  obstacles,
  connections: [],
  bounds,
})

const createObstacle = (
  obstacleId: string,
  componentId?: string,
): Obstacle => ({
  obstacleId,
  componentId,
  type: "rect",
  layers: ["top"],
  center: { x: 0, y: 0 },
  width: 1,
  height: 1,
  connectedTo: [],
})

test("fanout keepout handoff uses explicit source component metadata", () => {
  const sourceComponentId = "source-component"
  const sourcePad = createObstacle("source-pad", sourceComponentId)
  const previousKeepout = {
    ...createObstacle("previous-opaque-keepout", sourceComponentId),
    isFanoutSourceKeepout: true,
  }
  const unrelatedObstacle = createObstacle("unrelated", "other-component")
  const newKeepout = {
    ...createObstacle("new-opaque-keepout", sourceComponentId),
    isFanoutSourceKeepout: true,
  }
  const prefixImpostor = createObstacle(
    "fanout-source-keepout:not-actually-a-keepout",
    "impostor-component",
  )
  const routingPhasePlan: RoutingPhasePlan = {
    routingPhaseIndex: 0,
    routingPcbGroupId: "fanout-group",
    nets: [],
    traces: [],
  }

  const synchronized = Group_syncFanoutExitsWithGlobalConnections({
    fanoutInputSimpleRouteJson: createSimpleRouteJson([]),
    fanoutOutputSimpleRouteJson: createSimpleRouteJson([
      newKeepout,
      prefixImpostor,
    ]),
    baseSimpleRouteJson: createSimpleRouteJson([
      sourcePad,
      previousKeepout,
      unrelatedObstacle,
    ]),
    routingPhasePlan,
  })

  expect(synchronized.baseSimpleRouteJson.obstacles).toEqual([
    unrelatedObstacle,
    newKeepout,
  ])
})
