import type {
  ImplicitBreakoutPointSolverFn,
  ImplicitBreakoutPointSolverInput,
  ImplicitBreakoutSolverPoint,
} from "@tscircuit/props"
import type { PcbGroup, SourcePort, SourceTrace } from "circuit-json"
import type { z } from "zod"
import type { Group } from "../Group/Group"
import type { Breakout } from "./Breakout"
import {
  type ImplicitBreakoutPointSolverContext,
  createImplicitBreakoutPointSolverContext,
} from "./create-implicit-breakout-point-solver-input"
import { packBreakoutEdgeGroups } from "./pack-breakout-edge-groups"

type SourceTraceId = SourceTrace["source_trace_id"]
type SourcePortId = NonNullable<SourcePort["source_port_id"]>
type PcbGroupId = PcbGroup["pcb_group_id"]

export interface ImplicitBreakoutPointPlacement {
  sourcePortId: SourcePortId
  sourceTraceId: SourceTraceId
  layer: string
  x: number
  y: number
}

interface CoordinatedScopeSolution {
  breakoutPointsByRegionId: ReadonlyMap<
    PcbGroupId,
    readonly ImplicitBreakoutPointPlacement[]
  >
}

interface CachedRoutingScopeSolutions {
  solverFn: ImplicitBreakoutPointSolverFn
  solutions: CoordinatedScopeSolution[]
}

const cachedSolutionsByRoutingScope = new WeakMap<
  Group<z.ZodType>,
  CachedRoutingScopeSolutions
>()

const runSolverSynchronously = (
  solverFn: ImplicitBreakoutPointSolverFn,
  input: ImplicitBreakoutPointSolverInput,
): readonly ImplicitBreakoutSolverPoint[] => {
  const output = solverFn(input)
  if (output instanceof Promise) {
    throw new Error(
      "Implicit breakout point solvers must return synchronously during PCB layout",
    )
  }
  return output.breakoutPoints
}

/**
 * Solve a single-region breakout once per exit-edge group, then pack the
 * groups that share an edge so their points do not overlap.
 */
const solveSingleRegionEdgeGroups = (
  context: ImplicitBreakoutPointSolverContext,
  solverFn: ImplicitBreakoutPointSolverFn,
): readonly ImplicitBreakoutSolverPoint[] => {
  const { input, singleRegionEdgeGroups } = context
  const region = input.regions[0]!
  const blocksByEdge = new Map<
    (typeof region)["edge"],
    Parameters<typeof packBreakoutEdgeGroups>[0]["blocks"][number][]
  >()
  for (const group of singleRegionEdgeGroups!) {
    const groupConnectionIds = new Set(group.connectionIds)
    const points = runSolverSynchronously(solverFn, {
      ...input,
      regions: [{ ...region, edge: group.edge }],
      connections: input.connections.filter((connection) =>
        "type" in connection
          ? groupConnectionIds.has(connection.connections[0].connectionId)
          : groupConnectionIds.has(connection.connectionId),
      ),
      buses: input.buses
        .map((bus) => ({
          ...bus,
          connectionIds: bus.connectionIds.filter((connectionId) =>
            groupConnectionIds.has(connectionId),
          ),
        }))
        .filter((bus) => bus.connectionIds.length > 0),
    })
    const blocks = blocksByEdge.get(group.edge) ?? []
    blocks.push({ band: group.band, points })
    blocksByEdge.set(group.edge, blocks)
  }
  return [...blocksByEdge].flatMap(([edge, blocks]) =>
    packBreakoutEdgeGroups({
      bounds: region.bounds,
      edge,
      blocks,
      boundaryPointSpacing: input.boundaryPointSpacing,
    }),
  )
}

const solveScope = (
  breakout: Breakout,
  solverFn: ImplicitBreakoutPointSolverFn,
): CoordinatedScopeSolution => {
  const context = createImplicitBreakoutPointSolverContext(breakout)
  const singleRegionEdgeGroups = context.singleRegionEdgeGroups
  // One unbanded group is exactly the classic single-edge solve.
  const usesEdgeGroups =
    singleRegionEdgeGroups !== undefined &&
    (singleRegionEdgeGroups.length > 1 ||
      singleRegionEdgeGroups[0]?.band !== undefined)
  const outputBreakoutPoints = usesEdgeGroups
    ? solveSingleRegionEdgeGroups(context, solverFn)
    : runSolverSynchronously(solverFn, context.input)
  let expectedConnectionCount = 0
  for (const connection of context.input.connections) {
    if ("type" in connection) {
      expectedConnectionCount += connection.connections.length
      continue
    }
    expectedConnectionCount += 1
  }
  const breakoutPointsByRegionId = new Map<
    PcbGroupId,
    ImplicitBreakoutPointPlacement[]
  >()
  const outputPointKeys = new Set<string>()
  for (const region of context.input.regions) {
    breakoutPointsByRegionId.set(region.regionId, [])
  }
  for (const breakoutPoint of outputBreakoutPoints) {
    const regionBreakoutPoints = breakoutPointsByRegionId.get(
      breakoutPoint.regionId,
    )
    if (!regionBreakoutPoints) {
      throw new Error(
        `Implicit breakout point solver returned unknown region "${breakoutPoint.regionId}"`,
      )
    }
    const outputPointKey = `${breakoutPoint.regionId}:${breakoutPoint.connectionId}`
    if (outputPointKeys.has(outputPointKey)) {
      throw new Error(
        `Implicit breakout point solver returned duplicate endpoint for connection "${breakoutPoint.connectionId}" in region "${breakoutPoint.regionId}"`,
      )
    }
    outputPointKeys.add(outputPointKey)
    const sourcePortId = context.sourcePortIdByConnectionIdByRegionId
      .get(breakoutPoint.regionId)
      ?.get(breakoutPoint.connectionId)
    if (!sourcePortId) {
      throw new Error(
        `Implicit breakout point solver returned unknown connection "${breakoutPoint.connectionId}" for region "${breakoutPoint.regionId}"`,
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
    if (regionBreakoutPoints.length !== expectedConnectionCount) {
      throw new Error(
        `Implicit breakout point solver output is missing endpoints for region "${regionId}"`,
      )
    }
  }
  return { breakoutPointsByRegionId }
}

/** Return this region from the one cached solve owned by its routing scope. */
export const solveImplicitBreakoutPoints = (
  breakout: Breakout,
  solverFn: ImplicitBreakoutPointSolverFn,
): readonly ImplicitBreakoutPointPlacement[] => {
  const routingScope = breakout.parent as Group<z.ZodType> | null
  if (!routingScope || !breakout.pcb_group_id) {
    throw new Error(
      `Automatic breakout "${breakout.name}" has no coordinated PCB region`,
    )
  }
  let cachedSolutions = cachedSolutionsByRoutingScope.get(routingScope)
  if (!cachedSolutions || cachedSolutions.solverFn !== solverFn) {
    cachedSolutions = {
      solverFn,
      solutions: [],
    }
    cachedSolutionsByRoutingScope.set(routingScope, cachedSolutions)
  }
  let solution = cachedSolutions.solutions.find((candidateSolution) =>
    candidateSolution.breakoutPointsByRegionId.has(breakout.pcb_group_id!),
  )
  if (!solution) {
    solution = solveScope(breakout, solverFn)
    cachedSolutions.solutions.push(solution)
  }
  const breakoutPoints = solution.breakoutPointsByRegionId.get(
    breakout.pcb_group_id,
  )
  if (!breakoutPoints) {
    throw new Error(
      `Automatic breakout "${breakout.name}" references unknown implicit-breakout region "${breakout.pcb_group_id}"`,
    )
  }
  return breakoutPoints
}
