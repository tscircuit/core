import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"
import type { PcbGroup, SourcePort, SourceTrace } from "circuit-json"
import type { z } from "zod"
import type { Group } from "../Group/Group"
import type { Breakout } from "./Breakout"
import {
  type CoordinatedWindingBreakoutInput,
  createCoordinatedWindingBreakoutInput,
} from "./create-coordinated-winding-breakout-input"

type SourceTraceId = SourceTrace["source_trace_id"]
type SourcePortId = NonNullable<SourcePort["source_port_id"]>
type PcbGroupId = PcbGroup["pcb_group_id"]

export interface CoordinatedWindingBreakoutPoint {
  sourcePortId: SourcePortId
  sourceTraceId: SourceTraceId
  layer: string
  x: number
  y: number
}

interface CoordinatedScopeSolution {
  input: CoordinatedWindingBreakoutInput
  breakoutPointsByRegionId: ReadonlyMap<
    PcbGroupId,
    readonly CoordinatedWindingBreakoutPoint[]
  >
}

const solutionByRoutingScope = new WeakMap<
  Group<z.ZodType>,
  CoordinatedScopeSolution
>()

const getCanonicalLayerByConnectionId = (
  input: CoordinatedWindingBreakoutInput,
): Map<SourceTraceId, string> => {
  const layerByConnectionId = new Map<SourceTraceId, string>()
  for (const connection of input.solverInput.connections) {
    if ("type" in connection) {
      for (const pairMember of connection.connections) {
        layerByConnectionId.set(pairMember.id, connection.layer)
      }
      continue
    }
    layerByConnectionId.set(connection.id, connection.layer)
  }
  return layerByConnectionId
}

const solveCoordinatedScope = (
  breakout: Breakout,
): CoordinatedScopeSolution => {
  const input = createCoordinatedWindingBreakoutInput(breakout)
  const solver = new WindingBreakoutSolver(input.solverInput)
  solver.solve()
  if (solver.failed) {
    throw new Error(solver.error ?? "Coordinated winding breakout solve failed")
  }

  const output = solver.getOutput()
  const layerByConnectionId = getCanonicalLayerByConnectionId(input)
  const breakoutPointsByRegionId = new Map<
    PcbGroupId,
    CoordinatedWindingBreakoutPoint[]
  >()
  const outputPointKeys = new Set<string>()
  for (const region of input.solverInput.regions) {
    breakoutPointsByRegionId.set(region.id, [])
  }
  for (const breakoutPoint of output.breakoutPoints) {
    const regionBreakoutPoints = breakoutPointsByRegionId.get(
      breakoutPoint.regionId,
    )
    if (!regionBreakoutPoints) {
      throw new Error(
        `Winding solver returned unknown region "${breakoutPoint.regionId}"`,
      )
    }
    const outputPointKey = `${breakoutPoint.regionId}:${breakoutPoint.connectionId}`
    if (outputPointKeys.has(outputPointKey)) {
      throw new Error(
        `Winding solver returned duplicate endpoint for connection "${breakoutPoint.connectionId}" in region "${breakoutPoint.regionId}"`,
      )
    }
    outputPointKeys.add(outputPointKey)
    const sourcePortId = input.sourcePortIdByConnectionIdByRegionId
      .get(breakoutPoint.regionId)
      ?.get(breakoutPoint.connectionId)
    if (!sourcePortId) {
      throw new Error(
        `Winding solver returned unknown connection "${breakoutPoint.connectionId}" for region "${breakoutPoint.regionId}"`,
      )
    }
    const declaredLayer = layerByConnectionId.get(breakoutPoint.connectionId)
    if (declaredLayer !== breakoutPoint.layer) {
      throw new Error(
        `Winding solver reassigned connection "${breakoutPoint.connectionId}" from layer "${declaredLayer}" to "${breakoutPoint.layer}"`,
      )
    }
    regionBreakoutPoints.push({
      sourcePortId,
      sourceTraceId: breakoutPoint.connectionId,
      layer: breakoutPoint.layer,
      x: breakoutPoint.x,
      y: breakoutPoint.y,
    })
  }

  for (const [regionId, regionBreakoutPoints] of breakoutPointsByRegionId) {
    if (regionBreakoutPoints.length !== layerByConnectionId.size) {
      throw new Error(
        `Winding solver output is missing endpoints for region "${regionId}"`,
      )
    }
  }
  return { input, breakoutPointsByRegionId }
}

/** Return this region from the one cached solve owned by its routing scope. */
export const solveCoordinatedWindingBreakoutPoints = (
  breakout: Breakout,
): readonly CoordinatedWindingBreakoutPoint[] => {
  const routingScope = breakout.parent as Group<z.ZodType> | null
  if (!routingScope || !breakout.pcb_group_id) {
    throw new Error(
      `Automatic breakout "${breakout.name}" has no coordinated PCB region`,
    )
  }
  let solution = solutionByRoutingScope.get(routingScope)
  if (!solution) {
    solution = solveCoordinatedScope(breakout)
    solutionByRoutingScope.set(routingScope, solution)
  }
  const breakoutPoints = solution.breakoutPointsByRegionId.get(
    breakout.pcb_group_id,
  )
  if (!breakoutPoints) {
    throw new Error(
      `Automatic breakout "${breakout.name}" references unknown coordinated region "${breakout.pcb_group_id}"`,
    )
  }
  return breakoutPoints
}
