import type {
  Bounds,
  BreakoutEdge,
  ConnectionEndpoint,
  ConnectionOrDifferentialPair,
  WindingBreakoutBusInput,
  WindingBreakoutSolverInput,
} from "@tscircuit/winding-breakout-point-solver"
import type { PcbGroup, SourcePort, SourceTrace } from "circuit-json"
import type { z } from "zod"
import { AutoplacedBreakoutPoint } from "../AutoplacedBreakoutPoint"
import type { Bus } from "../Bus"
import type { DifferentialPair } from "../DifferentialPair"
import type { Group } from "../Group/Group"
import type { Port } from "../Port"
import type { Breakout } from "./Breakout"

type SourceTraceId = SourceTrace["source_trace_id"]
type SourcePortId = NonNullable<SourcePort["source_port_id"]>
type PcbGroupId = PcbGroup["pcb_group_id"]

interface BreakoutRegionGeometry {
  breakout: Breakout
  pcbGroupId: PcbGroupId
  bounds: Bounds
  center: { x: number; y: number }
  endpointBySourceTraceId: ReadonlyMap<SourceTraceId, ConnectionEndpoint>
  sourcePortIdBySourceTraceId: ReadonlyMap<SourceTraceId, SourcePortId>
}

interface DifferentialPairSourceTraces {
  differentialPair: DifferentialPair
  positiveSourceTraceId: SourceTraceId
  negativeSourceTraceId: SourceTraceId
}

export interface CoordinatedWindingBreakoutInput {
  routingScope: Group<z.ZodType>
  solverInput: WindingBreakoutSolverInput
  regionBoundsByRegionId: ReadonlyMap<PcbGroupId, Bounds>
  sourcePortIdByConnectionIdByRegionId: ReadonlyMap<
    PcbGroupId,
    ReadonlyMap<SourceTraceId, SourcePortId>
  >
}

const getRoutingScopeOrThrow = (breakout: Breakout): Group<z.ZodType> => {
  const routingScope = breakout.parent as Group<z.ZodType> | null
  if (!routingScope?.selectAll) {
    throw new Error(
      `Automatic breakout "${breakout.name}" has no coordinated routing scope`,
    )
  }
  return routingScope
}

const getAutomaticBreakouts = (routingScope: Group<z.ZodType>): Breakout[] => {
  const automaticBreakouts: Breakout[] = []
  for (const group of routingScope.selectAll("group") as Group<z.ZodType>[]) {
    if (!group.isRoutingDirective || group.parent !== routingScope) continue
    const breakout = group as Breakout
    const hasAutomaticBreakoutPoints = breakout.children.some(
      (child) => child instanceof AutoplacedBreakoutPoint,
    )
    if (hasAutomaticBreakoutPoints) automaticBreakouts.push(breakout)
  }
  return automaticBreakouts
}

export const hasMultipleAutomaticBreakoutsInScope = (
  breakout: Breakout,
): boolean => {
  const routingScope = getRoutingScopeOrThrow(breakout)
  return getAutomaticBreakouts(routingScope).length >= 2
}

/**
 * Collect a breakout region in board/circuit-world PCB coordinates. Bounds and
 * endpoint positions are points in millimeters with +X right and +Y top.
 */
const collectBreakoutRegionGeometry = (
  breakout: Breakout,
): BreakoutRegionGeometry => {
  if (!breakout.root || !breakout.pcb_group_id) {
    throw new Error(`Automatic breakout "${breakout.name}" has no PCB region`)
  }

  const pcbGroup = breakout.root.db.pcb_group.get(breakout.pcb_group_id)
  if (!pcbGroup || !pcbGroup.width || !pcbGroup.height) {
    throw new Error(
      `Automatic breakout "${breakout.name}" has invalid PCB region bounds`,
    )
  }
  const bounds = {
    minX: pcbGroup.center.x - pcbGroup.width / 2,
    maxX: pcbGroup.center.x + pcbGroup.width / 2,
    minY: pcbGroup.center.y - pcbGroup.height / 2,
    maxY: pcbGroup.center.y + pcbGroup.height / 2,
  }
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }

  const endpointBySourceTraceId = new Map<SourceTraceId, ConnectionEndpoint>()
  const sourcePortIdBySourceTraceId = new Map<SourceTraceId, SourcePortId>()
  for (const breakoutPoint of breakout.children.filter(
    (child) => child instanceof AutoplacedBreakoutPoint,
  ) as AutoplacedBreakoutPoint[]) {
    const matchedPort = breakoutPoint.matchedPort
    if (!matchedPort?.pcb_port_id || !matchedPort.source_port_id) {
      throw new Error(
        `Automatic breakout "${breakout.name}" is missing a PCB endpoint`,
      )
    }
    let sourceTraceId = breakoutPoint.matchedSourceTraceId
    if (!sourceTraceId) {
      const matchingSourceTraces = breakout.root.db.source_trace
        .list()
        .filter((sourceTrace) =>
          sourceTrace.connected_source_port_ids.includes(
            matchedPort.source_port_id!,
          ),
        )
      if (matchingSourceTraces.length === 0) {
        throw new Error(
          `Automatic breakout "${breakout.name}" has a point without a source trace identity`,
        )
      }
      if (matchingSourceTraces.length > 1) {
        throw new Error(
          `Automatic breakout "${breakout.name}" endpoint "${matchedPort.source_port_id}" resolves to duplicate connection identities`,
        )
      }
      sourceTraceId = matchingSourceTraces[0]!.source_trace_id
      breakoutPoint.matchedSourceTraceId = sourceTraceId
    }
    if (endpointBySourceTraceId.has(sourceTraceId)) {
      throw new Error(
        `Connection "${sourceTraceId}" has duplicate endpoint for region "${breakout.pcb_group_id}"`,
      )
    }
    const pcbPort = breakout.root.db.pcb_port.get(matchedPort.pcb_port_id)
    if (!pcbPort) {
      throw new Error(
        `Connection "${sourceTraceId}" references unknown PCB endpoint "${matchedPort.pcb_port_id}"`,
      )
    }
    if (pcbPort.pcb_group_id !== breakout.pcb_group_id) {
      throw new Error(
        `Connection "${sourceTraceId}" endpoint references unknown region "${pcbPort.pcb_group_id ?? "unassigned"}" instead of "${breakout.pcb_group_id}"`,
      )
    }
    if (pcbPort.x === undefined || pcbPort.y === undefined) {
      throw new Error(
        `Connection "${sourceTraceId}" is missing endpoint coordinates for region "${breakout.pcb_group_id}"`,
      )
    }

    endpointBySourceTraceId.set(sourceTraceId, {
      regionId: breakout.pcb_group_id,
      position: { x: pcbPort.x, y: pcbPort.y },
    })
    sourcePortIdBySourceTraceId.set(sourceTraceId, matchedPort.source_port_id)
  }

  return {
    breakout,
    pcbGroupId: breakout.pcb_group_id,
    bounds,
    center,
    endpointBySourceTraceId,
    sourcePortIdBySourceTraceId,
  }
}

const sortRegionsByPlacement = (
  regions: BreakoutRegionGeometry[],
): { regions: BreakoutRegionGeometry[]; horizontalPlacement: boolean } => {
  const xCoordinates = regions.map((region) => region.center.x)
  const yCoordinates = regions.map((region) => region.center.y)
  const xSpan = Math.max(...xCoordinates) - Math.min(...xCoordinates)
  const ySpan = Math.max(...yCoordinates) - Math.min(...yCoordinates)
  const horizontalPlacement = xSpan >= ySpan
  regions.sort((firstRegion, secondRegion) => {
    if (horizontalPlacement) {
      const xDifference = firstRegion.center.x - secondRegion.center.x
      if (xDifference !== 0) return xDifference
      const yDifference = firstRegion.center.y - secondRegion.center.y
      if (yDifference !== 0) return yDifference
    } else {
      const yDifference = firstRegion.center.y - secondRegion.center.y
      if (yDifference !== 0) return yDifference
      const xDifference = firstRegion.center.x - secondRegion.center.x
      if (xDifference !== 0) return xDifference
    }
    return firstRegion.breakout.name.localeCompare(secondRegion.breakout.name)
  })
  return { regions, horizontalPlacement }
}

const getFacingEdge = ({
  region,
  regionIndex,
  regions,
  horizontalPlacement,
}: {
  region: BreakoutRegionGeometry
  regionIndex: number
  regions: readonly BreakoutRegionGeometry[]
  horizontalPlacement: boolean
}): BreakoutEdge => {
  const otherRegions = regions.filter((candidate) => candidate !== region)
  const otherCenter = otherRegions.reduce(
    (sum, candidate) => ({
      x: sum.x + candidate.center.x / otherRegions.length,
      y: sum.y + candidate.center.y / otherRegions.length,
    }),
    { x: 0, y: 0 },
  )
  if (horizontalPlacement) {
    if (otherCenter.x > region.center.x) return "right"
    if (otherCenter.x < region.center.x) return "left"
    if (regionIndex < regions.length / 2) return "right"
    return "left"
  }
  if (otherCenter.y > region.center.y) return "top"
  if (otherCenter.y < region.center.y) return "bottom"
  if (regionIndex < regions.length / 2) return "top"
  return "bottom"
}

const getSourceTraceForConnectionOrThrow = ({
  connectionOwner,
  connectionOwnerLabel,
  connectionSelector,
  sourceTraces,
}: {
  connectionOwner: Pick<Bus, "getSubcircuit">
  connectionOwnerLabel: string
  connectionSelector: string
  sourceTraces: readonly SourceTrace[]
}): SourceTrace => {
  const sourceTracesWithMatchingName = sourceTraces.filter(
    (sourceTrace) => sourceTrace.name === connectionSelector,
  )
  let matchingSourceTraces = sourceTracesWithMatchingName
  if (matchingSourceTraces.length === 0) {
    const selectedPort = connectionOwner
      .getSubcircuit()
      .selectOne<Port>(connectionSelector, { type: "port" })
    if (selectedPort?.source_port_id) {
      matchingSourceTraces = sourceTraces.filter((sourceTrace) =>
        sourceTrace.connected_source_port_ids.includes(
          selectedPort.source_port_id!,
        ),
      )
    }
  }
  if (matchingSourceTraces.length === 0) {
    throw new Error(
      `Could not resolve "${connectionSelector}" in ${connectionOwnerLabel}`,
    )
  }
  if (matchingSourceTraces.length > 1) {
    throw new Error(
      `Connection "${connectionSelector}" resolves to multiple source traces in ${connectionOwnerLabel}`,
    )
  }
  return matchingSourceTraces[0]!
}

const getWindingSolverBuses = ({
  routingScope,
  sourceTraces,
  coordinatedSourceTraceIds,
}: {
  routingScope: Group<z.ZodType>
  sourceTraces: readonly SourceTrace[]
  coordinatedSourceTraceIds: ReadonlySet<SourceTraceId>
}): WindingBreakoutBusInput[] => {
  const solverBuses: WindingBreakoutBusInput[] = []
  const subcircuitId = routingScope.getSubcircuit().subcircuit_id
  for (const bus of routingScope.selectAll("bus") as Bus[]) {
    if (bus.getSubcircuit().subcircuit_id !== subcircuitId) continue
    const connectionIds: SourceTraceId[] = []
    for (const connectionSelector of bus._parsedProps.connections) {
      const sourceTrace = getSourceTraceForConnectionOrThrow({
        connectionOwner: bus,
        connectionOwnerLabel: `bus "${bus.name}"`,
        connectionSelector,
        sourceTraces,
      })
      if (coordinatedSourceTraceIds.has(sourceTrace.source_trace_id)) {
        connectionIds.push(sourceTrace.source_trace_id)
      }
    }
    if (connectionIds.length === 0) continue
    let solverBus: WindingBreakoutBusInput = {
      id: bus.name,
      connectionIds,
      // NOTE: preferredLayer is a permanent assignment despite its legacy
      // name. Pass it through unchanged so the solver can enforce that rule.
    }
    if (bus._parsedProps.preferredLayer !== undefined) {
      solverBus = {
        ...solverBus,
        preferredLayer: bus._parsedProps.preferredLayer,
      }
    }
    if (bus._parsedProps.preferredLayers !== undefined) {
      solverBus = {
        ...solverBus,
        preferredLayers: bus._parsedProps.preferredLayers,
      }
    }
    solverBuses.push(solverBus)
  }
  return solverBuses
}

const getDifferentialPairSourceTraces = ({
  routingScope,
  sourceTraces,
}: {
  routingScope: Group<z.ZodType>
  sourceTraces: readonly SourceTrace[]
}): DifferentialPairSourceTraces[] => {
  const subcircuitId = routingScope.getSubcircuit().subcircuit_id
  const pairs: DifferentialPairSourceTraces[] = []
  for (const differentialPair of routingScope.selectAll(
    "differentialpair",
  ) as DifferentialPair[]) {
    if (differentialPair.getSubcircuit().subcircuit_id !== subcircuitId) {
      continue
    }
    const positiveSourceTrace = getSourceTraceForConnectionOrThrow({
      connectionOwner: differentialPair,
      connectionOwnerLabel: `differential pair "${differentialPair.name}"`,
      connectionSelector: differentialPair._parsedProps.positiveConnection,
      sourceTraces,
    })
    const negativeSourceTrace = getSourceTraceForConnectionOrThrow({
      connectionOwner: differentialPair,
      connectionOwnerLabel: `differential pair "${differentialPair.name}"`,
      connectionSelector: differentialPair._parsedProps.negativeConnection,
      sourceTraces,
    })
    pairs.push({
      differentialPair,
      positiveSourceTraceId: positiveSourceTrace.source_trace_id,
      negativeSourceTraceId: negativeSourceTrace.source_trace_id,
    })
  }
  return pairs
}

const getBoundaryPointSpacing = (breakout: Breakout): number => {
  const board = breakout.root?.db.pcb_board.list()[0]
  const traceWidth = board?.min_trace_width ?? 0.15
  const boundaryPointClearance = board?.min_trace_to_pad_edge_clearance ?? 0.2
  const viaPadDiameter = board?.min_via_pad_diameter ?? 0.3
  return viaPadDiameter + 2 * (traceWidth + boundaryPointClearance)
}

/** Build one canonical winding input for every automatic breakout in a scope. */
export const createCoordinatedWindingBreakoutInput = (
  breakout: Breakout,
): CoordinatedWindingBreakoutInput => {
  if (!breakout.root) {
    throw new Error(`Automatic breakout "${breakout.name}" has no circuit root`)
  }
  const routingScope = getRoutingScopeOrThrow(breakout)
  const automaticBreakouts = getAutomaticBreakouts(routingScope)
  if (automaticBreakouts.length < 2) {
    throw new Error(
      `Coordinated winding breakout placement requires at least two automatic breakout regions in scope "${routingScope.name}"`,
    )
  }

  const regionIds = new Set<PcbGroupId>()
  const collectedRegions = automaticBreakouts.map((automaticBreakout) => {
    const region = collectBreakoutRegionGeometry(automaticBreakout)
    if (regionIds.has(region.pcbGroupId)) {
      throw new Error(
        `Duplicate automatic breakout region "${region.pcbGroupId}"`,
      )
    }
    regionIds.add(region.pcbGroupId)
    return region
  })
  const { regions, horizontalPlacement } =
    sortRegionsByPlacement(collectedRegions)

  const sourceTraceIds = new Set<SourceTraceId>()
  for (const region of regions) {
    for (const sourceTraceId of region.endpointBySourceTraceId.keys()) {
      sourceTraceIds.add(sourceTraceId)
    }
  }
  const sourceTraces = breakout.root.db.source_trace
    .list()
    .filter(
      (sourceTrace) =>
        sourceTrace.subcircuit_id ===
        routingScope.getSubcircuit().subcircuit_id,
    )
  const sourceTraceById = new Map<SourceTraceId, SourceTrace>()
  for (const sourceTrace of sourceTraces) {
    if (sourceTraceById.has(sourceTrace.source_trace_id)) {
      throw new Error(
        `Duplicate connection identity "${sourceTrace.source_trace_id}"`,
      )
    }
    sourceTraceById.set(sourceTrace.source_trace_id, sourceTrace)
  }
  const sortedSourceTraceIds = [...sourceTraceIds].sort(
    (firstSourceTraceId, secondSourceTraceId) => {
      const firstName =
        sourceTraceById.get(firstSourceTraceId)?.name ?? firstSourceTraceId
      const secondName =
        sourceTraceById.get(secondSourceTraceId)?.name ?? secondSourceTraceId
      const nameDifference = firstName.localeCompare(secondName)
      if (nameDifference !== 0) return nameDifference
      return firstSourceTraceId.localeCompare(secondSourceTraceId)
    },
  )
  for (const sourceTraceId of sortedSourceTraceIds) {
    if (!sourceTraceById.has(sourceTraceId)) {
      throw new Error(`Unknown connection identity "${sourceTraceId}"`)
    }
    for (const region of regions) {
      if (!region.endpointBySourceTraceId.has(sourceTraceId)) {
        throw new Error(
          `Connection "${sourceTraceId}" is missing endpoint for region "${region.pcbGroupId}"`,
        )
      }
    }
  }

  const buses = getWindingSolverBuses({
    routingScope,
    sourceTraces,
    coordinatedSourceTraceIds: sourceTraceIds,
  })
  const endpointsBySourceTraceId = new Map<
    SourceTraceId,
    readonly ConnectionEndpoint[]
  >()
  for (const sourceTraceId of sortedSourceTraceIds) {
    endpointsBySourceTraceId.set(
      sourceTraceId,
      regions.map(
        (region) => region.endpointBySourceTraceId.get(sourceTraceId)!,
      ),
    )
  }

  const differentialPairBySourceTraceId = new Map<
    SourceTraceId,
    DifferentialPairSourceTraces
  >()
  for (const pair of getDifferentialPairSourceTraces({
    routingScope,
    sourceTraces,
  })) {
    const positiveIsCoordinated = sourceTraceIds.has(pair.positiveSourceTraceId)
    const negativeIsCoordinated = sourceTraceIds.has(pair.negativeSourceTraceId)
    if (positiveIsCoordinated !== negativeIsCoordinated) {
      throw new Error(
        `Differential pair "${pair.differentialPair.name}" is missing one coordinated member`,
      )
    }
    if (!positiveIsCoordinated) continue
    if (
      differentialPairBySourceTraceId.has(pair.positiveSourceTraceId) ||
      differentialPairBySourceTraceId.has(pair.negativeSourceTraceId)
    ) {
      throw new Error("A connection belongs to multiple differential pairs")
    }
    differentialPairBySourceTraceId.set(pair.positiveSourceTraceId, pair)
    differentialPairBySourceTraceId.set(pair.negativeSourceTraceId, pair)
  }

  const connections: ConnectionOrDifferentialPair[] = []
  const addedDifferentialPairs = new Set<DifferentialPair>()
  for (const sourceTraceId of sortedSourceTraceIds) {
    const differentialPair = differentialPairBySourceTraceId.get(sourceTraceId)
    if (!differentialPair) {
      connections.push({
        id: sourceTraceId,
        endpoints: endpointsBySourceTraceId.get(sourceTraceId)!,
      })
      continue
    }
    if (addedDifferentialPairs.has(differentialPair.differentialPair)) continue
    addedDifferentialPairs.add(differentialPair.differentialPair)
    connections.push({
      type: "differential",
      connections: [
        {
          id: differentialPair.positiveSourceTraceId,
          endpoints: endpointsBySourceTraceId.get(
            differentialPair.positiveSourceTraceId,
          )!,
        },
        {
          id: differentialPair.negativeSourceTraceId,
          endpoints: endpointsBySourceTraceId.get(
            differentialPair.negativeSourceTraceId,
          )!,
        },
      ],
    })
  }

  const sourcePortIdByConnectionIdByRegionId = new Map<
    PcbGroupId,
    ReadonlyMap<SourceTraceId, SourcePortId>
  >()
  const regionBoundsByRegionId = new Map<PcbGroupId, Bounds>()
  const solverRegions = regions.map((region, regionIndex) => {
    sourcePortIdByConnectionIdByRegionId.set(
      region.pcbGroupId,
      region.sourcePortIdBySourceTraceId,
    )
    regionBoundsByRegionId.set(region.pcbGroupId, region.bounds)
    return {
      id: region.pcbGroupId,
      bounds: region.bounds,
      edge: getFacingEdge({
        region,
        regionIndex,
        regions,
        horizontalPlacement,
      }),
    }
  })

  return {
    routingScope,
    solverInput: {
      regions: solverRegions,
      connections,
      buses,
      boundaryPointSpacing: getBoundaryPointSpacing(breakout),
    },
    regionBoundsByRegionId,
    sourcePortIdByConnectionIdByRegionId,
  }
}
