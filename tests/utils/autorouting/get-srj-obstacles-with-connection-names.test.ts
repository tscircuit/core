import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { getSrjObstaclesWithConnectionNames } from "lib/utils/autorouting/getSrjObstaclesWithConnectionNames"
import type { SimpleRouteConnection } from "lib/utils/autorouting/SimpleRouteJson"
import type { Obstacle } from "lib/utils/obstacles/types"

test("SRJ obstacles keep local identities and routed connection names", () => {
  const connectivityMap = new ConnectivityMap({
    connectivity_net0: [
      "source_net_0",
      "source_trace_0",
      "source_port_0",
      "pcb_port_0",
      "pcb_smtpad_0",
      "pcb_trace_0",
      "pcb_via_0",
    ],
  })
  const connections: SimpleRouteConnection[] = [
    {
      name: "source_net_0",
      pointsToConnect: [
        {
          x: 0,
          y: 0,
          layer: "top",
          pointId: "pcb_port_0",
          pcb_port_id: "pcb_port_0",
        },
      ],
    },
  ]
  const obstacles: Obstacle[] = [
    {
      type: "rect",
      layers: ["top"],
      center: { x: 0, y: 0 },
      width: 1,
      height: 1,
      connectedTo: ["pcb_smtpad_0", "connectivity_net0"],
      circuitJsonMetadata: {
        pcb_smtpad_id: "pcb_smtpad_0",
        pcb_port_id: "pcb_port_0",
      },
    },
    {
      type: "rect",
      layers: ["top"],
      center: { x: 1, y: 0 },
      width: 1,
      height: 0.1,
      connectedTo: ["pcb_trace_0"],
    },
  ]

  expect(
    getSrjObstaclesWithConnectionNames({
      connectivityMap,
      connections,
      obstacles,
    }).map((obstacle) => obstacle.connectedTo),
  ).toEqual([
    ["pcb_smtpad_0", "connectivity_net0", "pcb_port_0", "source_net_0"],
    ["pcb_trace_0", "source_net_0"],
  ])
})
