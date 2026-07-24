import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { jlcMinTolerances } from "@tscircuit/jlcpcb-manufacturing-specs"
import {
  type DifferentialPairName,
  DifferentialPairPostProcessingSolver,
  type DifferentialPairPostProcessingSolverParams,
  type PcbLayer,
  type PcbRoutingObstacle,
  type PcbRoutingObstacleId,
  type PcbTraceForPostProcessing,
  type PcbTraceId,
  type PcbViaForPostProcessing,
  type ResolvedDifferentialPair,
  type SourceTraceId,
} from "@tscircuit/length-matching-solver"
import type {
  LayerRef,
  PcbTrace,
  PcbTraceWarningInput,
  PcbVia,
} from "circuit-json"
import { distance } from "circuit-json"
import { getDescendantSubcircuitIds } from "lib/utils/autorouting/getAncestorSubcircuitIds"
import { getDifferentialPairsForSimpleRouteJson } from "lib/utils/autorouting/getDifferentialPairsForSimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import type { DifferentialPair } from "../DifferentialPair"
import { getTraceLength } from "../Trace/trace-utils/compute-trace-length"
import type { Group } from "./Group"

type ResolvedCoreDifferentialPair = {
  solverPair: ResolvedDifferentialPair
  positivePcbTrace: PcbTrace
  negativePcbTrace: PcbTrace
  hasUnsupportedTraceCardinality: boolean
}

const getOwnedDifferentialPairs = (group: Group<any>): DifferentialPair[] =>
  (group.selectAll<DifferentialPair>("differentialpair") ?? []).filter(
    (differentialPair) => differentialPair.getSubcircuit() === group,
  )

const getWarningId = (subcircuitId: string, sourceTraceId: string): string =>
  `pcb_trace_warning_${subcircuitId}_${sourceTraceId}_differential_pair_post_processing`

const copyEndpointPcbPortMetadata = (
  replacementRoute: PcbTrace["route"],
  originalRoute: PcbTrace["route"],
): PcbTrace["route"] => {
  if (replacementRoute.length === 0 || originalRoute.length === 0) {
    return replacementRoute
  }

  const copiedRoute = replacementRoute.map((routePoint) => ({ ...routePoint }))
  const replacementFirstPoint = copiedRoute[0]
  const replacementLastPoint = copiedRoute[copiedRoute.length - 1]
  const originalFirstPoint = originalRoute[0]
  const originalLastPoint = originalRoute[originalRoute.length - 1]

  if (
    replacementFirstPoint?.route_type === "wire" &&
    originalFirstPoint?.route_type === "wire"
  ) {
    replacementFirstPoint.start_pcb_port_id =
      originalFirstPoint.start_pcb_port_id
    replacementFirstPoint.end_pcb_port_id ??= originalFirstPoint.end_pcb_port_id
  }
  if (
    replacementLastPoint?.route_type === "wire" &&
    originalLastPoint?.route_type === "wire"
  ) {
    replacementLastPoint.end_pcb_port_id = originalLastPoint.end_pcb_port_id
    replacementLastPoint.start_pcb_port_id ??=
      originalLastPoint.start_pcb_port_id
  }

  return copiedRoute
}

const restoreDeletedPcbVias = (
  db: CircuitJsonUtilObjects,
  deletedPcbVias: PcbVia[],
): void => {
  for (const pcbVia of deletedPcbVias) {
    if (db.pcb_via.get(pcbVia.pcb_via_id)) continue
    db.insert(pcbVia)
  }
}

const applyRoutedPairAtomically = ({
  db,
  group,
  resolvedPair,
  positivePcbTrace,
  negativePcbTrace,
  replacementPcbVias,
}: {
  db: CircuitJsonUtilObjects
  group: Group<any>
  resolvedPair: ResolvedCoreDifferentialPair
  positivePcbTrace: PcbTraceForPostProcessing
  negativePcbTrace: PcbTraceForPostProcessing
  replacementPcbVias: PcbViaForPostProcessing[]
}): void => {
  const originalPositivePcbTrace = resolvedPair.positivePcbTrace
  const originalNegativePcbTrace = resolvedPair.negativePcbTrace
  const pairPcbTraceIds = new Set([
    originalPositivePcbTrace.pcb_trace_id,
    originalNegativePcbTrace.pcb_trace_id,
  ])

  if (
    positivePcbTrace.pcb_trace_id !== originalPositivePcbTrace.pcb_trace_id ||
    positivePcbTrace.source_trace_id !==
      originalPositivePcbTrace.source_trace_id ||
    negativePcbTrace.pcb_trace_id !== originalNegativePcbTrace.pcb_trace_id ||
    negativePcbTrace.source_trace_id !==
      originalNegativePcbTrace.source_trace_id
  ) {
    throw new Error(
      `Differential pair "${resolvedPair.solverPair.name}" returned mismatched trace identifiers`,
    )
  }

  for (const replacementPcbVia of replacementPcbVias) {
    const expectedSourceTraceId =
      replacementPcbVia.pcb_trace_id === positivePcbTrace.pcb_trace_id
        ? positivePcbTrace.source_trace_id
        : replacementPcbVia.pcb_trace_id === negativePcbTrace.pcb_trace_id
          ? negativePcbTrace.source_trace_id
          : undefined
    if (
      !replacementPcbVia.pcb_trace_id ||
      !pairPcbTraceIds.has(replacementPcbVia.pcb_trace_id) ||
      replacementPcbVia.source_trace_id !== expectedSourceTraceId
    ) {
      throw new Error(
        `Differential pair "${resolvedPair.solverPair.name}" returned a via without matching pair identifiers`,
      )
    }
  }

  const positiveRoute = copyEndpointPcbPortMetadata(
    positivePcbTrace.route as PcbTrace["route"],
    originalPositivePcbTrace.route,
  )
  const negativeRoute = copyEndpointPcbPortMetadata(
    negativePcbTrace.route as PcbTrace["route"],
    originalNegativePcbTrace.route,
  )
  const originalPcbVias = db.pcb_via
    .list()
    .filter(
      (pcbVia) =>
        pcbVia.pcb_trace_id && pairPcbTraceIds.has(pcbVia.pcb_trace_id),
    )
  const originalPcbViaIds = new Set(
    originalPcbVias.map((pcbVia) => pcbVia.pcb_via_id),
  )
  const replacementPcbViaIds = new Set<string>()
  for (const replacementPcbVia of replacementPcbVias) {
    if (replacementPcbViaIds.has(replacementPcbVia.pcb_via_id)) {
      throw new Error(
        `Differential pair "${resolvedPair.solverPair.name}" returned duplicate via id "${replacementPcbVia.pcb_via_id}"`,
      )
    }
    replacementPcbViaIds.add(replacementPcbVia.pcb_via_id)
    const existingPcbVia = db.pcb_via.get(replacementPcbVia.pcb_via_id)
    if (existingPcbVia && !originalPcbViaIds.has(existingPcbVia.pcb_via_id)) {
      throw new Error(
        `Differential pair "${resolvedPair.solverPair.name}" returned via id "${replacementPcbVia.pcb_via_id}" already owned by unrelated geometry`,
      )
    }
  }
  const insertedPcbViaIds: string[] = []
  const deletedPcbVias: PcbVia[] = []

  try {
    db.pcb_trace.update(originalPositivePcbTrace.pcb_trace_id, {
      route: positiveRoute,
      trace_length: getTraceLength(positiveRoute),
    })
    db.pcb_trace.update(originalNegativePcbTrace.pcb_trace_id, {
      route: negativeRoute,
      trace_length: getTraceLength(negativeRoute),
    })

    for (const originalPcbVia of originalPcbVias) {
      db.pcb_via.delete(originalPcbVia.pcb_via_id)
      deletedPcbVias.push(originalPcbVia)
    }

    for (const replacementPcbVia of replacementPcbVias) {
      const sourceTrace = db.source_trace.get(
        replacementPcbVia.source_trace_id!,
      )
      const insertedPcbVia = db.insert({
        type: "pcb_via",
        pcb_via_id: replacementPcbVia.pcb_via_id,
        x: replacementPcbVia.x,
        y: replacementPcbVia.y,
        outer_diameter: replacementPcbVia.outer_diameter,
        hole_diameter: replacementPcbVia.hole_diameter,
        layers: replacementPcbVia.layers as LayerRef[],
        pcb_trace_id: replacementPcbVia.pcb_trace_id,
        subcircuit_id: group.subcircuit_id ?? undefined,
        pcb_group_id: group.pcb_group_id ?? undefined,
        subcircuit_connectivity_map_key:
          sourceTrace?.subcircuit_connectivity_map_key,
      }) as PcbVia
      insertedPcbViaIds.push(insertedPcbVia.pcb_via_id)
    }
  } catch (error) {
    db.pcb_trace.update(originalPositivePcbTrace.pcb_trace_id, {
      route: originalPositivePcbTrace.route,
      trace_length: originalPositivePcbTrace.trace_length,
    })
    db.pcb_trace.update(originalNegativePcbTrace.pcb_trace_id, {
      route: originalNegativePcbTrace.route,
      trace_length: originalNegativePcbTrace.trace_length,
    })
    for (const insertedPcbViaId of insertedPcbViaIds) {
      db.pcb_via.delete(insertedPcbViaId)
    }
    restoreDeletedPcbVias(db, deletedPcbVias)
    throw error
  }
}

const insertOriginalRetainedWarnings = ({
  db,
  subcircuitId,
  resolvedPair,
  failure,
}: {
  db: CircuitJsonUtilObjects
  subcircuitId: string
  resolvedPair: ResolvedCoreDifferentialPair
  failure: {
    category: string
    message: string
    layer?: PcbLayer
    viaPairBudget?: number
  }
}): void => {
  const sourceTraceIds = [
    resolvedPair.solverPair.positiveSourceTraceId,
    resolvedPair.solverPair.negativeSourceTraceId,
  ]
  const pcbTraces = [
    resolvedPair.positivePcbTrace,
    resolvedPair.negativePcbTrace,
  ]
  const pcbPortIds = Array.from(
    new Set(
      pcbTraces.flatMap((pcbTrace) =>
        pcbTrace.route.flatMap((routePoint) => {
          if (routePoint.route_type !== "wire") return []
          return [
            routePoint.start_pcb_port_id,
            routePoint.end_pcb_port_id,
          ].filter((pcbPortId): pcbPortId is string => Boolean(pcbPortId))
        }),
      ),
    ),
  )
  const pcbComponentIds = Array.from(
    new Set(
      pcbPortIds.flatMap((pcbPortId) => {
        const pcbComponentId = db.pcb_port.get(pcbPortId)?.pcb_component_id
        return pcbComponentId ? [pcbComponentId] : []
      }),
    ),
  )
  const failureContext = [
    failure.layer ? `layer=${failure.layer}` : null,
    failure.viaPairBudget !== undefined
      ? `via_pair_budget=${failure.viaPairBudget}`
      : null,
  ]
    .filter(Boolean)
    .join(", ")
  const message =
    `Differential pair "${resolvedPair.solverPair.name}" routing failed ` +
    `(${failure.category}${failureContext ? `; ${failureContext}` : ""}): ` +
    `${failure.message}. Positive source trace ${sourceTraceIds[0]}, negative ` +
    `source trace ${sourceTraceIds[1]}; original geometry was retained.`

  for (const [traceIndex, pcbTrace] of pcbTraces.entries()) {
    const sourceTraceId = sourceTraceIds[traceIndex]!
    const warningId = getWarningId(subcircuitId, sourceTraceId)
    if (db.pcb_trace_warning.get(warningId)) {
      db.pcb_trace_warning.delete(warningId)
    }
    db.insert({
      type: "pcb_trace_warning",
      pcb_trace_warning_id: warningId,
      warning_type: "pcb_trace_warning",
      message,
      pcb_trace_id: pcbTrace.pcb_trace_id,
      source_trace_id: sourceTraceId,
      pcb_component_ids: pcbComponentIds,
      pcb_port_ids: pcbPortIds,
      subcircuit_id: subcircuitId,
    } satisfies PcbTraceWarningInput)
  }
}

const getSolverObstacles = (
  obstacles: ReturnType<
    typeof getSimpleRouteJsonFromCircuitJson
  >["simpleRouteJson"]["obstacles"],
): PcbRoutingObstacle[] =>
  obstacles.map((obstacle) => ({
    obstacle_id: (obstacle.obstacleId ??
      [
        "subcircuit_obstacle",
        ...obstacle.layers.slice().sort(),
        obstacle.center.x,
        obstacle.center.y,
        obstacle.width,
        obstacle.height,
        obstacle.ccwRotationDegrees ?? 0,
        ...obstacle.connectedTo.slice().sort(),
      ].join("_")) as PcbRoutingObstacleId,
    type: "rect",
    layers: obstacle.layers as PcbLayer[],
    center: obstacle.center,
    width: obstacle.width,
    height: obstacle.height,
    ccwRotationDegrees: obstacle.ccwRotationDegrees,
    connectedTo: obstacle.connectedTo,
  }))

export const Group_doInitialPcbTracePostProcessing = (
  group: Group<any>,
): void => {
  if (!group.isSubcircuit || group.root?.pcbDisabled) return
  if (
    group.root?.pcbRoutingDisabled ||
    group.getInheritedProperty("routingDisabled") ||
    group._isInflatedFromCircuitJson
  ) {
    return
  }

  const differentialPairs = getOwnedDifferentialPairs(group)
  if (differentialPairs.length === 0) return
  const explicitDifferentialPairNames = new Set<string>()
  for (const differentialPair of differentialPairs) {
    const explicitName = differentialPair._parsedProps.name
    if (!explicitName) continue
    if (explicitDifferentialPairNames.has(explicitName)) {
      throw new Error(
        `Differential pair names must be unique within subcircuit "${group.name}"`,
      )
    }
    explicitDifferentialPairNames.add(explicitName)
  }
  const { db } = group.root!
  const subcircuitId = group.subcircuit_id
  if (!subcircuitId) {
    throw new Error(
      `Cannot post-process differential pairs for ${group.getString()} without a subcircuit id`,
    )
  }

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db,
    circuitJson: db
      .toArray()
      .filter(
        (element) => element.type !== "pcb_trace" && element.type !== "pcb_via",
      ),
    subcircuit_id: subcircuitId,
    subcircuitComponent: group,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const scopedSubcircuitIds = new Set([
    subcircuitId,
    ...getDescendantSubcircuitIds(db, subcircuitId),
  ])
  const scopedPcbTraces = db.pcb_trace
    .list()
    .filter((pcbTrace) =>
      scopedSubcircuitIds.has(pcbTrace.subcircuit_id ?? subcircuitId),
    )
  const scopedPcbVias = db.pcb_via
    .list()
    .filter((pcbVia) =>
      scopedSubcircuitIds.has(pcbVia.subcircuit_id ?? subcircuitId),
    )
  const resolvedPairs: ResolvedCoreDifferentialPair[] = []

  for (const differentialPair of differentialPairs) {
    const [srjDifferentialPair] =
      getDifferentialPairsForSimpleRouteJson({
        srjConnections: simpleRouteJson.connections,
        differentialPairs: [differentialPair],
        sourceTraces: db.source_trace.list(),
        subcircuitId,
      }) ?? []
    if (!srjDifferentialPair) continue

    const pairSourceTraceIds = srjDifferentialPair.connectionNames.map(
      (connectionName) => {
        const srjConnection = simpleRouteJson.connections.find(
          (connection) => connection.name === connectionName,
        )
        if (!srjConnection?.source_trace_id) {
          throw new Error(
            `Differential pair "${differentialPair.name}" cannot post-process connection "${connectionName}" without a source trace`,
          )
        }
        return srjConnection.source_trace_id
      },
    ) as [string, string]
    const [positivePcbTraces, negativePcbTraces] = pairSourceTraceIds.map(
      (sourceTraceId) =>
        scopedPcbTraces.filter(
          (pcbTrace) => pcbTrace.source_trace_id === sourceTraceId,
        ),
    )
    const positivePcbTrace = positivePcbTraces[0]
    const negativePcbTrace = negativePcbTraces[0]
    if (!positivePcbTrace && !negativePcbTrace) continue
    if (!positivePcbTrace || !negativePcbTrace) {
      throw new Error(
        `Differential pair "${differentialPair.name}" has routed PCB geometry for only one connection`,
      )
    }

    const differentialPairName = (differentialPair._parsedProps.name ??
      `${pairSourceTraceIds[0]}:${pairSourceTraceIds[1]}`) as DifferentialPairName
    resolvedPairs.push({
      solverPair: {
        name: differentialPairName,
        positiveSourceTraceId: pairSourceTraceIds[0] as SourceTraceId,
        negativeSourceTraceId: pairSourceTraceIds[1] as SourceTraceId,
        maxLengthSkew: srjDifferentialPair.lengthTolerance,
      },
      positivePcbTrace,
      negativePcbTrace,
      hasUnsupportedTraceCardinality:
        positivePcbTraces.length !== 1 || negativePcbTraces.length !== 1,
    })
  }
  resolvedPairs.sort((pairA, pairB) =>
    pairA.solverPair.name < pairB.solverPair.name
      ? -1
      : pairA.solverPair.name > pairB.solverPair.name
        ? 1
        : 0,
  )
  for (let pairIndex = 1; pairIndex < resolvedPairs.length; pairIndex++) {
    if (
      resolvedPairs[pairIndex - 1]!.solverPair.name ===
      resolvedPairs[pairIndex]!.solverPair.name
    ) {
      throw new Error(
        `Differential pair names must be unique within subcircuit "${group.name}"`,
      )
    }
  }
  if (resolvedPairs.length === 0) return

  const board = db.pcb_board.list()[0]
  const traceClearance = distance.parse(
    group._getAutorouterConfig().traceClearance ?? 0.1,
  )
  const viaHoleDiameter =
    simpleRouteJson.minViaHoleDiameter ??
    board?.min_via_hole_diameter ??
    jlcMinTolerances.min_via_hole_diameter!
  const viaOuterDiameter =
    simpleRouteJson.minViaPadDiameter ??
    board?.min_via_pad_diameter ??
    jlcMinTolerances.min_via_pad_diameter!
  const solverParams: DifferentialPairPostProcessingSolverParams = {
    pcbTraces: scopedPcbTraces as unknown as PcbTraceForPostProcessing[],
    pcbVias: scopedPcbVias.map((pcbVia) => ({
      ...pcbVia,
      pcb_via_id: pcbVia.pcb_via_id as PcbViaForPostProcessing["pcb_via_id"],
      pcb_trace_id: pcbVia.pcb_trace_id as PcbTraceId | undefined,
      layers: pcbVia.layers as PcbLayer[],
      source_trace_id: pcbVia.pcb_trace_id
        ? (db.pcb_trace.get(pcbVia.pcb_trace_id)
            ?.source_trace_id as SourceTraceId)
        : undefined,
    })),
    differentialPairs: resolvedPairs.map((pair) => pair.solverPair),
    obstacles: getSolverObstacles(simpleRouteJson.obstacles),
    board: simpleRouteJson.bounds,
    designRules: {
      traceToTraceClearance: traceClearance,
      traceToObstacleClearance:
        simpleRouteJson.minTraceToPadEdgeClearance ?? traceClearance,
      viaToTraceClearance: traceClearance,
      viaToObstacleClearance:
        simpleRouteJson.minViaEdgeToPadEdgeClearance ?? traceClearance,
      boardEdgeClearance:
        simpleRouteJson.minBoardEdgeClearance ??
        jlcMinTolerances.min_board_edge_clearance!,
      viaHoleDiameter,
      viaOuterDiameter,
    },
    layerCount: group._getSubcircuitLayerCount(),
  }
  const solver = new DifferentialPairPostProcessingSolver(solverParams)
  group.root!.emit("solver:started", {
    type: "solver:started",
    solverName: "DifferentialPairPostProcessingSolver",
    solverParams: solver.getConstructorParams()[0],
    componentName: group.getString(),
  })
  solver.solve()
  const output = solver.getOutput()
  const pairResultsByName = new Map(
    output.pairResults.map((pairResult) => [
      pairResult.differentialPairName,
      pairResult,
    ]),
  )
  if (
    pairResultsByName.size !== resolvedPairs.length ||
    output.pairResults.length !== resolvedPairs.length
  ) {
    throw new Error(
      `Differential pair solver returned ${output.pairResults.length} results for ${resolvedPairs.length} pairs`,
    )
  }

  const replacementPcbViaIds = new Set<string>()
  for (const resolvedPair of resolvedPairs) {
    const pairResult = pairResultsByName.get(resolvedPair.solverPair.name)
    if (!pairResult) {
      throw new Error(
        `Differential pair solver omitted result for "${resolvedPair.solverPair.name}"`,
      )
    }
    if (
      resolvedPair.hasUnsupportedTraceCardinality &&
      (pairResult.status !== "original_retained" ||
        pairResult.failure.category !== "unsupported_route_geometry")
    ) {
      throw new Error(
        `Differential pair solver must retain "${resolvedPair.solverPair.name}" because a member has multiple PCB trace rows`,
      )
    }
    if (pairResult.status === "original_retained") continue

    if (
      pairResult.positivePcbTrace.pcb_trace_id !==
        resolvedPair.positivePcbTrace.pcb_trace_id ||
      pairResult.positivePcbTrace.source_trace_id !==
        resolvedPair.positivePcbTrace.source_trace_id ||
      pairResult.negativePcbTrace.pcb_trace_id !==
        resolvedPair.negativePcbTrace.pcb_trace_id ||
      pairResult.negativePcbTrace.source_trace_id !==
        resolvedPair.negativePcbTrace.source_trace_id
    ) {
      throw new Error(
        `Differential pair "${resolvedPair.solverPair.name}" returned mismatched trace identifiers`,
      )
    }

    const expectedSourceTraceIdByPcbTraceId = new Map([
      [
        pairResult.positivePcbTrace.pcb_trace_id,
        pairResult.positivePcbTrace.source_trace_id,
      ],
      [
        pairResult.negativePcbTrace.pcb_trace_id,
        pairResult.negativePcbTrace.source_trace_id,
      ],
    ])
    const originalPairPcbViaIds = new Set(
      db.pcb_via
        .list()
        .filter((pcbVia) =>
          expectedSourceTraceIdByPcbTraceId.has(
            pcbVia.pcb_trace_id as PcbTraceId,
          ),
        )
        .map((pcbVia) => pcbVia.pcb_via_id),
    )
    for (const replacementPcbVia of pairResult.pcbVias) {
      if (
        !replacementPcbVia.pcb_trace_id ||
        replacementPcbVia.source_trace_id !==
          expectedSourceTraceIdByPcbTraceId.get(
            replacementPcbVia.pcb_trace_id,
          ) ||
        replacementPcbViaIds.has(replacementPcbVia.pcb_via_id)
      ) {
        throw new Error(
          `Differential pair "${resolvedPair.solverPair.name}" returned mismatched or duplicate via identifiers`,
        )
      }
      replacementPcbViaIds.add(replacementPcbVia.pcb_via_id)
      const existingPcbVia = db.pcb_via.get(replacementPcbVia.pcb_via_id)
      if (
        existingPcbVia &&
        !originalPairPcbViaIds.has(existingPcbVia.pcb_via_id)
      ) {
        throw new Error(
          `Differential pair "${resolvedPair.solverPair.name}" returned via id "${replacementPcbVia.pcb_via_id}" already owned by unrelated geometry`,
        )
      }
    }
  }

  for (const resolvedPair of resolvedPairs) {
    const pairResult = pairResultsByName.get(resolvedPair.solverPair.name)
    if (!pairResult) {
      throw new Error(
        `Differential pair solver omitted result for "${resolvedPair.solverPair.name}"`,
      )
    }
    if (pairResult.status === "original_retained") {
      insertOriginalRetainedWarnings({
        db,
        subcircuitId,
        resolvedPair,
        failure: pairResult.failure,
      })
      continue
    }

    applyRoutedPairAtomically({
      db,
      group,
      resolvedPair,
      positivePcbTrace: pairResult.positivePcbTrace,
      negativePcbTrace: pairResult.negativePcbTrace,
      replacementPcbVias: pairResult.pcbVias,
    })
    for (const sourceTraceId of [
      resolvedPair.solverPair.positiveSourceTraceId,
      resolvedPair.solverPair.negativeSourceTraceId,
    ]) {
      const warningId = getWarningId(subcircuitId, sourceTraceId)
      if (db.pcb_trace_warning.get(warningId)) {
        db.pcb_trace_warning.delete(warningId)
      }
    }
  }
}
