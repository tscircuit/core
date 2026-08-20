import type { BreakoutPointSolverInput } from "@tscircuit/breakout-point-solver"
import type {
  BreakoutEdge,
  ConnectionOrDifferentialPair,
  WindingBreakoutSolverInput,
} from "@tscircuit/winding-breakout-point-solver"
import type { PcbGroup, SourcePort, SourceTrace } from "circuit-json"
import type { z } from "zod"
import type { Bus } from "../Bus"
import type { DifferentialPair } from "../DifferentialPair"
import type { Group } from "../Group/Group"
import type { Port } from "../Port"
import { BreakoutPoint } from "../BreakoutPoint"
import type { Breakout } from "./Breakout"
import { createBreakoutPointSolverInput } from "./createBreakoutPointSolverInput"

type SourceTraceId = SourceTrace["source_trace_id"]
type SourcePortId = NonNullable<SourcePort["source_port_id"]>
type PcbGroupId = PcbGroup["pcb_group_id"]
type LegacyBreakoutPointSolverInput = BreakoutPointSolverInput

interface BreakoutRegionInput {
  breakout: Breakout
  pcbGroupId: PcbGroupId
  legacyInput: LegacyBreakoutPointSolverInput
}

interface DifferentialPairSourceTraces {
  differentialPair: DifferentialPair
  positiveSourceTraceId: SourceTraceId
  negativeSourceTraceId: SourceTraceId
}

export interface CoordinatedWindingBreakoutInput {
  solverInput: WindingBreakoutSolverInput
  sourcePortIdByConnectionIdByRegionId: ReadonlyMap<
    PcbGroupId,
    ReadonlyMap<SourceTraceId, SourcePortId>
  >
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
  let selectedPort: Port | null = null
  if (sourceTracesWithMatchingName.length === 0) {
    selectedPort = connectionOwner
      .getSubcircuit()
      .selectOne<Port>(connectionSelector, { type: "port" })
  }
  let matchingSourceTraces = sourceTracesWithMatchingName
  if (selectedPort?.source_port_id) {
    matchingSourceTraces = sourceTraces.filter((sourceTrace) =>
      sourceTrace.connected_source_port_ids.includes(
        selectedPort.source_port_id!,
      ),
    )
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

const getLayerBySourceTraceId = ({
  routingScope,
  sourceTraces,
}: {
  routingScope: Group<z.ZodType>
  sourceTraces: readonly SourceTrace[]
}): Map<SourceTraceId, string> => {
  const layerBySourceTraceId = new Map<SourceTraceId, string>()
  const subcircuitId = routingScope.getSubcircuit().subcircuit_id
  for (const bus of routingScope.selectAll("bus") as Bus[]) {
    if (bus.getSubcircuit().subcircuit_id !== subcircuitId) continue
    const declaredLayer = bus._parsedProps.preferredLayer
    if (declaredLayer === undefined) continue
    for (const connectionSelector of bus._parsedProps.connections) {
      const sourceTrace = getSourceTraceForConnectionOrThrow({
        connectionOwner: bus,
        connectionOwnerLabel: `bus "${bus.name}"`,
        connectionSelector,
        sourceTraces,
      })
      const previousLayer = layerBySourceTraceId.get(
        sourceTrace.source_trace_id,
      )
      if (previousLayer !== undefined && previousLayer !== declaredLayer) {
        throw new Error(
          `Connection "${sourceTrace.name ?? sourceTrace.source_trace_id}" has conflicting preferred layers "${previousLayer}" and "${declaredLayer}"`,
        )
      }
      layerBySourceTraceId.set(sourceTrace.source_trace_id, declaredLayer)
    }
  }
  return layerBySourceTraceId
}

const getBreakoutRegionInputs = (
  routingScope: Group<z.ZodType>,
): BreakoutRegionInput[] => {
  const breakoutRegions: BreakoutRegionInput[] = []
  for (const group of routingScope.selectAll("group") as Group<z.ZodType>[]) {
    if (!group.isRoutingDirective || group.parent !== routingScope) continue
    const candidateBreakout = group as Breakout
    if (
      candidateBreakout.children.some((child) => child instanceof BreakoutPoint)
    ) {
      continue
    }
    const legacyInput = createBreakoutPointSolverInput(candidateBreakout)
    if (!legacyInput || !candidateBreakout.pcb_group_id) continue
    breakoutRegions.push({
      breakout: candidateBreakout,
      pcbGroupId: candidateBreakout.pcb_group_id,
      legacyInput,
    })
  }
  return breakoutRegions
}

const getSourceTraceIdsWithOneEndpoint = (
  breakoutRegion: BreakoutRegionInput,
): Set<SourceTraceId> =>
  new Set(
    breakoutRegion.legacyInput.traces.flatMap((trace) => {
      if (trace.insidePorts.length !== 1) return []
      return [trace.sourceTraceId]
    }),
  )

const getSharedSourceTraceIds = (
  firstRegion: BreakoutRegionInput,
  secondRegion: BreakoutRegionInput,
): SourceTraceId[] => {
  const firstSourceTraceIds = getSourceTraceIdsWithOneEndpoint(firstRegion)
  return [...getSourceTraceIdsWithOneEndpoint(secondRegion)].filter(
    (sourceTraceId) => firstSourceTraceIds.has(sourceTraceId),
  )
}

const getFacingEdges = (
  firstRegion: BreakoutRegionInput,
  secondRegion: BreakoutRegionInput,
): ReadonlyMap<PcbGroupId, BreakoutEdge> | null => {
  const firstBounds = firstRegion.legacyInput.bounds
  const secondBounds = secondRegion.legacyInput.bounds
  const firstCenter = {
    x: (firstBounds.minX + firstBounds.maxX) / 2,
    y: (firstBounds.minY + firstBounds.maxY) / 2,
  }
  const secondCenter = {
    x: (secondBounds.minX + secondBounds.maxX) / 2,
    y: (secondBounds.minY + secondBounds.maxY) / 2,
  }
  const deltaX = secondCenter.x - firstCenter.x
  const deltaY = secondCenter.y - firstCenter.y
  if (deltaX === 0 && deltaY === 0) return null

  const edgeByRegionId = new Map<PcbGroupId, BreakoutEdge>()
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    if (deltaX > 0) {
      edgeByRegionId.set(firstRegion.pcbGroupId, "right")
      edgeByRegionId.set(secondRegion.pcbGroupId, "left")
    } else {
      edgeByRegionId.set(firstRegion.pcbGroupId, "left")
      edgeByRegionId.set(secondRegion.pcbGroupId, "right")
    }
    return edgeByRegionId
  }
  if (deltaY > 0) {
    edgeByRegionId.set(firstRegion.pcbGroupId, "top")
    edgeByRegionId.set(secondRegion.pcbGroupId, "bottom")
  } else {
    edgeByRegionId.set(firstRegion.pcbGroupId, "bottom")
    edgeByRegionId.set(secondRegion.pcbGroupId, "top")
  }
  return edgeByRegionId
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

/**
 * Build the winding solver boundary input from Core's board/circuit-world PCB
 * geometry. Bounds and endpoint positions are points in millimeters with +X
 * right and +Y top. Only an explicitly parsed bus `preferredLayer` owns a
 * connection layer; allowed-layer sets and the board stackup are not used.
 */
export const createCoordinatedWindingBreakoutInput = (
  breakout: Breakout,
): CoordinatedWindingBreakoutInput | null => {
  if (!breakout.root || !breakout.pcb_group_id) return null
  const routingScope = breakout.parent as Group<z.ZodType> | null
  if (!routingScope?.selectAll) return null
  const subcircuitId = routingScope.getSubcircuit().subcircuit_id
  const sourceTraces = breakout.root.db.source_trace
    .list()
    .filter((sourceTrace) => sourceTrace.subcircuit_id === subcircuitId)
  const layerBySourceTraceId = getLayerBySourceTraceId({
    routingScope,
    sourceTraces,
  })
  if (layerBySourceTraceId.size === 0) return null

  const breakoutRegions = getBreakoutRegionInputs(routingScope)
  const currentRegion = breakoutRegions.find(
    (candidate) => candidate.breakout === breakout,
  )
  if (!currentRegion) return null
  const peerRegions = breakoutRegions.filter((candidate) => {
    if (candidate === currentRegion) return false
    return getSharedSourceTraceIds(currentRegion, candidate).length > 0
  })
  if (peerRegions.length !== 1) return null
  const peerRegion = peerRegions[0]!
  const coordinatedRegions = breakoutRegions.filter(
    (candidate) => candidate === currentRegion || candidate === peerRegion,
  )
  const [firstRegion, secondRegion] = coordinatedRegions
  if (!firstRegion || !secondRegion) return null
  const edgeByRegionId = getFacingEdges(firstRegion, secondRegion)
  if (!edgeByRegionId) return null

  const sharedSourceTraceIds = getSharedSourceTraceIds(
    firstRegion,
    secondRegion,
  ).sort((first, second) => first.localeCompare(second))
  if (sharedSourceTraceIds.length === 0) return null
  if (
    sharedSourceTraceIds.some(
      (sourceTraceId) => !layerBySourceTraceId.has(sourceTraceId),
    )
  ) {
    return null
  }
  const sharedSourceTraceIdSet = new Set(sharedSourceTraceIds)

  const traceBySourceTraceIdByRegionId = new Map(
    coordinatedRegions.map((region) => [
      region.pcbGroupId,
      new Map(
        region.legacyInput.traces.map((trace) => [trace.sourceTraceId, trace]),
      ),
    ]),
  )
  const sourcePortIdByConnectionIdByRegionId = new Map<
    PcbGroupId,
    Map<SourceTraceId, SourcePortId>
  >()
  for (const region of coordinatedRegions) {
    const sourcePortIdByConnectionId = new Map<SourceTraceId, SourcePortId>()
    const traceBySourceTraceId = traceBySourceTraceIdByRegionId.get(
      region.pcbGroupId,
    )!
    for (const sourceTraceId of sharedSourceTraceIds) {
      const insidePort =
        traceBySourceTraceId.get(sourceTraceId)!.insidePorts[0]!
      sourcePortIdByConnectionId.set(sourceTraceId, insidePort.sourcePortId)
    }
    sourcePortIdByConnectionIdByRegionId.set(
      region.pcbGroupId,
      sourcePortIdByConnectionId,
    )
  }

  const endpointsBySourceTraceId = new Map(
    sharedSourceTraceIds.map((sourceTraceId) => [
      sourceTraceId,
      coordinatedRegions.map((region) => ({
        regionId: region.pcbGroupId,
        position: traceBySourceTraceIdByRegionId
          .get(region.pcbGroupId)!
          .get(sourceTraceId)!.insidePorts[0]!.position,
      })),
    ]),
  )

  const differentialPairBySourceTraceId = new Map<
    SourceTraceId,
    DifferentialPairSourceTraces
  >()
  for (const pair of getDifferentialPairSourceTraces({
    routingScope,
    sourceTraces,
  })) {
    const positiveIsShared = sharedSourceTraceIdSet.has(
      pair.positiveSourceTraceId,
    )
    const negativeIsShared = sharedSourceTraceIdSet.has(
      pair.negativeSourceTraceId,
    )
    if (positiveIsShared !== negativeIsShared) return null
    if (!positiveIsShared) continue
    const positiveLayer = layerBySourceTraceId.get(pair.positiveSourceTraceId)!
    const negativeLayer = layerBySourceTraceId.get(pair.negativeSourceTraceId)!
    if (positiveLayer !== negativeLayer) {
      throw new Error(
        `Differential pair "${pair.differentialPair.name}" declares layers "${positiveLayer}" and "${negativeLayer}"`,
      )
    }
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
  for (const sourceTraceId of sharedSourceTraceIds) {
    const differentialPair = differentialPairBySourceTraceId.get(sourceTraceId)
    if (!differentialPair) {
      connections.push({
        id: sourceTraceId,
        layer: layerBySourceTraceId.get(sourceTraceId)!,
        endpoints: endpointsBySourceTraceId.get(sourceTraceId)!,
      })
      continue
    }
    if (addedDifferentialPairs.has(differentialPair.differentialPair)) continue
    addedDifferentialPairs.add(differentialPair.differentialPair)
    connections.push({
      type: "differential",
      layer: layerBySourceTraceId.get(differentialPair.positiveSourceTraceId)!,
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

  return {
    solverInput: {
      regions: coordinatedRegions.map((region) => ({
        id: region.pcbGroupId,
        bounds: region.legacyInput.bounds,
        edge: edgeByRegionId.get(region.pcbGroupId)!,
      })),
      connections,
      boundaryPointSpacing: Math.max(
        ...coordinatedRegions.map(
          (region) => region.legacyInput.boundaryPointSpacing ?? 0,
        ),
      ),
    },
    sourcePortIdByConnectionIdByRegionId,
  }
}
