import { expect, test } from "bun:test"
import {
  getAutorouterSolverName,
  TscircuitAutorouter,
} from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getPresetAutoroutingConfig } from "lib/utils/autorouting/getPresetAutoroutingConfig"

test("auto autorouter selects AutoroutingPipelineSolver9_PreloadedTraceGraph for late routing phases with preloaded traces (#3312)", () => {
  const latePhaseSrj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    obstacles: [
      {
        type: "rect",
        layers: ["top"],
        center: { x: -4, y: 2 },
        width: 1,
        height: 1,
        connectedTo: ["pcb_port_1"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: { x: 4, y: 2 },
        width: 1,
        height: 1,
        connectedTo: ["pcb_port_2"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: { x: -4, y: -2 },
        width: 1,
        height: 1,
        connectedTo: ["pcb_port_3"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: { x: 4, y: -2 },
        width: 1,
        height: 1,
        connectedTo: ["pcb_port_4"],
      },
    ],
    connections: [
      {
        name: "source_trace_2",
        pointsToConnect: [
          { x: -4, y: -2, layer: "top", pcb_port_id: "pcb_port_3" },
          { x: 4, y: -2, layer: "top", pcb_port_id: "pcb_port_4" },
        ],
      },
    ],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "source_trace_1_0",
        connection_name: "source_trace_1",
        route: [
          {
            route_type: "wire",
            x: -4,
            y: 2,
            width: 0.15,
            layer: "top",
          },
          {
            route_type: "wire",
            x: 4,
            y: 2,
            width: 0.15,
            layer: "top",
          },
        ],
      },
    ],
  }

  const autoConfig = getPresetAutoroutingConfig("auto")
  let selectedSolverName: string | undefined

  const autorouter = new TscircuitAutorouter(latePhaseSrj, {
    autorouterVersion: autoConfig.autorouterVersion,
    onSolverStarted: ({ solverName }) => {
      selectedSolverName = solverName
    },
  })

  expect(selectedSolverName).toBe(
    "AutoroutingPipelineSolver9_PreloadedTraceGraph",
  )
  expect(
    getAutorouterSolverName({
      autorouterVersion: autoConfig.autorouterVersion,
      input: latePhaseSrj,
    }),
  ).toBe("AutoroutingPipelineSolver9_PreloadedTraceGraph")

  const routedTraces = autorouter.solveSync()
  expect(routedTraces.length).toBeGreaterThanOrEqual(1)
  expect(
    routedTraces.some((trace) => trace.connection_name === "source_trace_2"),
  ).toBe(true)
})
