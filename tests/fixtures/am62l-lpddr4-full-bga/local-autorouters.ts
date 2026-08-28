import { FixedTargetBgaFanoutSolver } from "@tscircuit/bga-fanout-solver"
import {
  AutoroutingPipelineSolver2_PortPointPathing,
  type SimpleRouteJson as CapacitySimpleRouteJson,
} from "@tscircuit/capacity-autorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

const solveFixedTargetBgaFanout = async (
  input: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> => {
  const solverInput = structuredClone(input)
  const sourcePointIds = new Set(
    solverInput.connections.flatMap((connection) => {
      const source = connection.pointsToConnect[0]
      return [source?.pointId, source?.pcb_port_id].filter((id): id is string =>
        Boolean(id),
      )
    }),
  )
  const sourceComponentId = solverInput.obstacles.find(
    (obstacle) =>
      obstacle.componentId &&
      sourcePointIds.has(obstacle.circuitJsonMetadata?.pcb_port_id ?? ""),
  )?.componentId
  const sourceInternalConnection = solverInput.obstacles.find(
    (obstacle) =>
      obstacle.componentId === sourceComponentId &&
      obstacle.netIsAssignable &&
      obstacle.offBoardConnectsTo?.length === 1,
  )?.offBoardConnectsTo?.[0]

  if (sourceInternalConnection) {
    // Board-wide pours are connected to both BGA internal GND groups. Core's
    // flattened SRJ obstacle carries the first identity; scope it to the
    // active breakout so the local solver can deterministically claim it.
    for (const obstacle of solverInput.obstacles) {
      if (!obstacle.isCopperPour || !obstacle.netIsAssignable) continue
      obstacle.offBoardConnectsTo = [sourceInternalConnection]
    }
  }

  const solver = new FixedTargetBgaFanoutSolver(solverInput)
  solver.solve()
  if (solver.failed || !solver.solved) {
    throw new Error(solver.error ?? "Fixed-target BGA fanout failed")
  }
  const output = solver.getOutput()
  const priorTraceIds = new Set(
    (input.traces ?? []).map((trace) => trace.pcb_trace_id),
  )
  const newSignalTraces = output.traces.filter(
    (trace) => !priorTraceIds.has(trace.pcb_trace_id),
  )
  const newPowerTraces = (output.powerTraces ?? []).filter(
    (trace) => !priorTraceIds.has(trace.pcb_trace_id),
  )
  const signalSourceTraceIds = new Set(
    input.connections
      .map((connection) => connection.source_trace_id)
      .filter((id): id is string => Boolean(id)),
  )
  const groundSourceTraceId = solverInput.obstacles
    .filter(
      (obstacle) =>
        obstacle.componentId === sourceComponentId && obstacle.netIsAssignable,
    )
    .flatMap((obstacle) => obstacle.connectedTo)
    .filter(
      (id) => id.startsWith("source_trace_") && !signalSourceTraceIds.has(id),
    )
    .sort()[0]
  if (groundSourceTraceId) {
    for (const trace of newPowerTraces) {
      ;(
        trace as SimplifiedPcbTrace & { source_trace_id?: string }
      ).source_trace_id = groundSourceTraceId
    }
  }

  return [...newSignalTraces, ...newPowerTraces]
}

const intersectsBounds = (
  obstacle: SimpleRouteJson["obstacles"][number],
  bounds: SimpleRouteJson["bounds"],
) =>
  obstacle.center.x + obstacle.width / 2 >= bounds.minX &&
  obstacle.center.x - obstacle.width / 2 <= bounds.maxX &&
  obstacle.center.y + obstacle.height / 2 >= bounds.minY &&
  obstacle.center.y - obstacle.height / 2 <= bounds.maxY

const solveCapacityChannel = async (
  input: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> => {
  const traces: SimplifiedPcbTrace[] = []

  for (const connection of input.connections) {
    const xs = connection.pointsToConnect.map((point) => point.x)
    const ys = connection.pointsToConnect.map((point) => point.y)
    const routingMargin = Math.max(
      input.minTraceWidth ?? 0,
      input.minTraceToPadEdgeClearance ?? 0,
      (input.minViaPadDiameter ?? input.minViaDiameter ?? 0) / 2,
    )
    const bounds = {
      minX: Math.min(...xs) - routingMargin,
      maxX: Math.max(...xs) + routingMargin,
      minY: Math.min(...ys) - routingMargin,
      maxY: Math.max(...ys) + routingMargin,
    }
    const connectionInput: SimpleRouteJson = {
      ...structuredClone(input),
      bounds,
      connections: [structuredClone(connection)],
      buses: [],
      obstacles: input.obstacles.filter((obstacle) =>
        intersectsBounds(obstacle, bounds),
      ),
    }
    const solver = new AutoroutingPipelineSolver2_PortPointPathing(
      connectionInput as unknown as CapacitySimpleRouteJson,
      { capacityDepth: 2, effort: 1 },
    )
    solver.solve()
    if (solver.failed || !solver.solved) {
      throw new Error(
        `Capacity channel routing failed for ${connection.name}: ${solver.error ?? "unknown solver error"}`,
      )
    }
    const routed = solver.getOutputSimpleRouteJson().traces ?? []
    if (routed.length !== 1) {
      throw new Error(
        `Capacity channel routing produced ${routed.length} traces for ${connection.name}, expected 1`,
      )
    }
    const terminalLayers = new Set(
      connection.pointsToConnect.map((point) => point.layer),
    )
    if (terminalLayers.size !== 1) {
      throw new Error(
        `Capacity channel routing requires one preassigned terminal layer for ${connection.name}`,
      )
    }
    const [terminalLayer] = terminalLayers
    const outputTrace = routed[0] as SimplifiedPcbTrace
    if (outputTrace.route.some((point) => point.route_type !== "wire")) {
      throw new Error(
        `Capacity channel routing unexpectedly added a layer transition for ${connection.name}`,
      )
    }
    outputTrace.connection_name = connection.name
    outputTrace.connectsTo = [
      ...new Set(
        connection.pointsToConnect.flatMap((point) =>
          [point.pointId, point.pcb_port_id].filter((id): id is string =>
            Boolean(id),
          ),
        ),
      ),
    ]
    for (const routePoint of outputTrace.route) {
      if (routePoint.route_type === "wire") routePoint.layer = terminalLayer
    }
    traces.push(outputTrace)
  }

  return traces
}

export const createFixedTargetBgaFanoutAutorouter = createBasicAutorouter(
  solveFixedTargetBgaFanout,
)

export const createCapacityChannelAutorouter =
  createBasicAutorouter(solveCapacityChannel)

export const createExistingCopperConnectivityAutorouter = createBasicAutorouter(
  async () => [],
)
