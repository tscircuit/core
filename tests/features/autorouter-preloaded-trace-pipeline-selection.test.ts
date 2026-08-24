import { describe, expect, test } from "bun:test"
import {
  type SolverStartedDetails,
  TscircuitAutorouter,
} from "lib/utils/autorouting/CapacityMeshAutorouter"
import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"

describe("autorouter preloaded trace pipeline selection", () => {
  const createBaseSimpleRouteJson = (): SimpleRouteJson => ({
    layerCount: 2,
    minTraceWidth: 0.15,
    obstacles: [
      {
        type: "rect",
        layers: ["top", "bottom"],
        center: { x: 0, y: 0 },
        width: 4,
        height: 4,
        connectedTo: [],
      },
    ],
    connections: [
      {
        name: "conn1",
        pointsToConnect: [
          { x: -10, y: 0, layer: "top" },
          { x: 10, y: 0, layer: "top" },
        ],
      },
    ],
    bounds: { minX: -20, maxX: 20, minY: -20, maxY: 20 },
  })

  test("selects AutoroutingPipelineSolver7_MultiGraph by default when no preloaded traces exist", () => {
    const srj = createBaseSimpleRouteJson()
    let solverDetails: SolverStartedDetails | undefined

    new TscircuitAutorouter(srj, {
      onSolverStarted: (details) => {
        solverDetails = details
      },
    })

    expect(solverDetails?.solverName).toBe(
      "AutoroutingPipelineSolver7_MultiGraph",
    )
  })

  test("selects AutoroutingPipelineSolver9_PreloadedTraceGraph when input contains preloaded traces", () => {
    const srj = createBaseSimpleRouteJson()
    srj.traces = [
      {
        type: "pcb_trace",
        pcb_trace_id: "preloaded_trace_1",
        connection_name: "conn_preloaded_1",
        route: [
          { route_type: "wire", x: -8, y: 5, width: 0.15, layer: "top" },
          { route_type: "wire", x: 8, y: 5, width: 0.15, layer: "top" },
        ],
      },
    ]

    let solverDetails: SolverStartedDetails | undefined
    new TscircuitAutorouter(srj, {
      onSolverStarted: (details) => {
        solverDetails = details
      },
    })

    expect(solverDetails?.solverName).toBe(
      "AutoroutingPipelineSolver9_PreloadedTraceGraph",
    )
  })

  test("respects explicit autorouterVersion even when preloaded traces are present", () => {
    const srj = createBaseSimpleRouteJson()
    srj.traces = [
      {
        type: "pcb_trace",
        pcb_trace_id: "preloaded_trace_1",
        connection_name: "conn_preloaded_1",
        route: [
          { route_type: "wire", x: -8, y: 5, width: 0.15, layer: "top" },
          { route_type: "wire", x: 8, y: 5, width: 0.15, layer: "top" },
        ],
      },
    ]

    let solverDetails: SolverStartedDetails | undefined
    new TscircuitAutorouter(srj, {
      autorouterVersion: "beta_pipeline7",
      onSolverStarted: (details) => {
        solverDetails = details
      },
    })

    expect(solverDetails?.solverName).toBe(
      "AutoroutingPipelineSolver7_MultiGraph",
    )
  })

  test("successfully solves a late routing phase fixture with 4 remaining connections, 389 obstacles, and 205 traces within iteration limits", () => {
    // Generate 389 obstacles arranged on a grid across the board
    const obstacles: Obstacle[] = []
    let obstacleCount = 0
    for (let row = -10; row <= 10 && obstacleCount < 389; row++) {
      for (let col = -10; col <= 10 && obstacleCount < 389; col++) {
        // Leave channels open around y = 0, y = 10, y = -10, y = 20 for routing corridors
        if (
          Math.abs(row) === 0 ||
          Math.abs(row) === 5 ||
          Math.abs(row) === 10
        ) {
          continue
        }
        obstacles.push({
          type: "rect",
          layers: ["top", "bottom"],
          center: { x: col * 3.5, y: row * 3.5 },
          width: 1.0,
          height: 1.0,
          connectedTo: [`net_obs_${obstacleCount}`],
        })
        obstacleCount++
      }
    }

    // Fill any remaining up to 389 along outer perimeter
    let extraIndex = 0
    while (obstacles.length < 389) {
      obstacles.push({
        type: "rect",
        layers: ["top", "bottom"],
        center: {
          x: -45 + (extraIndex % 20) * 4,
          y: 42 + Math.floor(extraIndex / 20) * 3,
        },
        width: 0.8,
        height: 0.8,
        connectedTo: [`net_extra_${extraIndex}`],
      })
      extraIndex++
    }

    // Generate 205 preloaded traces representing previously routed nets
    const preloadedTraces: SimplifiedPcbTrace[] = []
    for (let i = 0; i < 205; i++) {
      const col = (i % 25) - 12
      const rowBand = Math.floor(i / 25)
      const yOffset = -35 + rowBand * 8
      preloadedTraces.push({
        type: "pcb_trace",
        pcb_trace_id: `preloaded_trace_${i}`,
        connection_name: `net_phase_prior_${i}`,
        route: [
          {
            route_type: "wire",
            x: col * 3.2 - 1.0,
            y: yOffset,
            width: 0.15,
            layer: i % 2 === 0 ? "top" : "bottom",
          },
          {
            route_type: "wire",
            x: col * 3.2 + 1.0,
            y: yOffset,
            width: 0.15,
            layer: i % 2 === 0 ? "top" : "bottom",
          },
        ],
      })
    }

    // Define 4 remaining connections to route in this late phase
    const connections: SimpleRouteConnection[] = [
      {
        name: "late_conn_1",
        pointsToConnect: [
          { x: -35, y: 0, layer: "top" },
          { x: 35, y: 0, layer: "top" },
        ],
      },
      {
        name: "late_conn_2",
        pointsToConnect: [
          { x: -35, y: 17.5, layer: "bottom" },
          { x: 35, y: 17.5, layer: "bottom" },
        ],
      },
      {
        name: "late_conn_3",
        pointsToConnect: [
          { x: -35, y: -17.5, layer: "top" },
          { x: 35, y: -17.5, layer: "top" },
        ],
      },
      {
        name: "late_conn_4",
        pointsToConnect: [
          { x: -35, y: 35, layer: "top" },
          { x: 35, y: 35, layer: "bottom" },
        ],
      },
    ]

    expect(obstacles.length).toBe(389)
    expect(preloadedTraces.length).toBe(205)
    expect(connections.length).toBe(4)

    const latePhaseSimpleRouteJson: SimpleRouteJson = {
      layerCount: 2,
      minTraceWidth: 0.15,
      minViaDiameter: 0.6,
      minViaHoleDiameter: 0.3,
      minViaPadDiameter: 0.6,
      minTraceToPadEdgeClearance: 0.15,
      bounds: { minX: -50, maxX: 50, minY: -50, maxY: 50 },
      obstacles,
      traces: preloadedTraces,
      connections,
    }

    let selectedSolverName: string | undefined
    const autorouter = new TscircuitAutorouter(latePhaseSimpleRouteJson, {
      onSolverStarted: (details) => {
        selectedSolverName = details.solverName
      },
    })

    expect(selectedSolverName).toBe(
      "AutoroutingPipelineSolver9_PreloadedTraceGraph",
    )

    const outputTraces = autorouter.solveSync()

    expect(outputTraces).toBeDefined()
    expect(outputTraces.length).toBeGreaterThanOrEqual(4)

    // Verify all 4 remaining connections are successfully routed
    const routedConnectionNames = new Set(
      outputTraces.map((t) => t.connection_name),
    )
    for (const conn of connections) {
      expect(routedConnectionNames.has(conn.name)).toBe(true)
    }
  })
})
