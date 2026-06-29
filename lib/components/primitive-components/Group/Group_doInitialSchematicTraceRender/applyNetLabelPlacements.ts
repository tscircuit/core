import { Group } from "../Group"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import {
  computeSchematicNetLabelCenter,
  getSchematicNetLabelTextWidth,
} from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { AxisDirection } from "./getSide"
import { oppositeSide } from "./oppositeSide"
import { Port } from "../../Port"
import { getNetNameFromPorts } from "./getNetNameFromPorts"
import Debug from "debug"
import type { SourceNet } from "circuit-json"
import {
  getPortIdsInsideExpandedTextBounds,
  snapPointToPinInsideExpandedBoundingBox,
} from "./snap-to-pins-inside-expanded-bounding-box"
import type { NetLabel } from "../../NetLabel"

const debug = Debug("Group_doInitialSchematicTraceRender")
const NET_LABEL_TEXT_HEIGHT = 0.18

type Point = { x: number; y: number }

const getNetLabelTextBounds = ({
  center,
  text,
}: {
  center: Point
  text: string
}) => {
  const width = getSchematicNetLabelTextWidth({ text })
  const halfWidth = width / 2
  const halfHeight = NET_LABEL_TEXT_HEIGHT / 2
  return {
    minX: center.x - halfWidth,
    maxX: center.x + halfWidth,
    minY: center.y - halfHeight,
    maxY: center.y + halfHeight,
  }
}

const netLabelTextBoundsOverlap = (
  a: ReturnType<typeof getNetLabelTextBounds>,
  b: ReturnType<typeof getNetLabelTextBounds>,
) =>
  a.minX < b.maxX &&
  a.maxX > b.minX &&
  a.minY < b.maxY &&
  a.maxY > b.minY

export function applyNetLabelPlacements(args: {
  group: Group<any>
  solver: SchematicTracePipelineSolver
  userNetIdToConnKey: Map<string, string>
  connKeyToSourceNet: Map<string, SourceNet>
  pinIdToSchematicPortId: Map<string, string>
  connKeysWithExplicitPortNetTraces: Set<string>
  schematicPortIdsWithPreExistingNetLabels: Set<string>
  schematicPortIdsWithRoutedTraces: Set<string>
}) {
  const {
    group,
    solver,
    connKeyToSourceNet,
    userNetIdToConnKey,
    pinIdToSchematicPortId,
    connKeysWithExplicitPortNetTraces,
    schematicPortIdsWithPreExistingNetLabels,
    schematicPortIdsWithRoutedTraces,
  } = args
  const { db } = group.root!
  const eligiblePortIds = getPortIdsInsideExpandedTextBounds(db)
  const explicitNetLabelTextsByPortId = new Map<string, Set<string>>()
  // schematic_net_label_ids of explicit <netlabel> JSX components, keyed by
  // connected schematic port and net text. This prevents a solver placement for
  // one port from deleting explicit labels elsewhere on the same named net.
  const explicitNetLabelIdsByPortIdAndText = new Map<string, Set<string>>()
  const explicitNetLabels = new Map<
    string,
    {
      text: string
      source_net_id?: string | null
      center?: Point
    }
  >()
  for (const netLabel of group.selectAll("netlabel") as NetLabel[]) {
    const text = netLabel._getNetName()
    if (netLabel.schematic_net_label_id) {
      const dbNetLabel = db.schematic_net_label.get(
        netLabel.schematic_net_label_id,
      )
      if (dbNetLabel) {
        explicitNetLabels.set(netLabel.schematic_net_label_id, {
          text,
          source_net_id: dbNetLabel.source_net_id,
          center: dbNetLabel.center,
        })
      }
    }

    for (const port of netLabel._getConnectedPorts()) {
      if (!port.schematic_port_id) continue
      if (!explicitNetLabelTextsByPortId.has(port.schematic_port_id)) {
        explicitNetLabelTextsByPortId.set(port.schematic_port_id, new Set())
      }
      explicitNetLabelTextsByPortId.get(port.schematic_port_id)!.add(text)
      if (netLabel.schematic_net_label_id) {
        const key = `${port.schematic_port_id}::${text}`
        if (!explicitNetLabelIdsByPortIdAndText.has(key)) {
          explicitNetLabelIdsByPortIdAndText.set(key, new Set())
        }
        explicitNetLabelIdsByPortIdAndText
          .get(key)!
          .add(netLabel.schematic_net_label_id)
      }
    }
  }

  // Place net labels suggested by the solver
  const netLabelPlacements =
    solver.netLabelNetLabelCollisionSolver?.getOutput().netLabelPlacements ??
    solver.netLabelTraceCollisionSolver?.getOutput().netLabelPlacements ??
    solver.netLabelPlacementSolver?.netLabelPlacements ??
    solver.traceLabelOverlapAvoidanceSolver?.getOutput().netLabelPlacements ??
    []
  const dedupedNetLabelPlacements: typeof netLabelPlacements = []
  const netLabelPlacementKeys = new Set<string>()
  for (const placement of netLabelPlacements) {
    const pinIds = [...(placement.pinIds ?? [])].sort()
    const key = `${placement.globalConnNetId}|${pinIds.join("::")}|${placement.netId ?? ""}`
    if (netLabelPlacementKeys.has(key)) {
      debug(
        `skipping duplicate placement for "${placement.netId}" REASON:identical net label placement`,
      )
      continue
    }
    netLabelPlacementKeys.add(key)
    dedupedNetLabelPlacements.push(placement)
  }

  const netLabelPlacementCountByGlobalNetId = new Map<string, number>()
  const routedPairKeysByGlobalNetId = new Map<string, Set<string>>()
  const globalNetIdsWithPortOnlyPlacements = new Set<string>()
  for (const placement of dedupedNetLabelPlacements) {
    netLabelPlacementCountByGlobalNetId.set(
      placement.globalConnNetId,
      (netLabelPlacementCountByGlobalNetId.get(placement.globalConnNetId) ??
        0) + 1,
    )
    if ((placement.pinIds?.length ?? 0) > 1) {
      if (!routedPairKeysByGlobalNetId.has(placement.globalConnNetId)) {
        routedPairKeysByGlobalNetId.set(placement.globalConnNetId, new Set())
      }
      routedPairKeysByGlobalNetId
        .get(placement.globalConnNetId)!
        .add(placement.pinIds.slice().sort().join("::"))
    }
    if ((placement.pinIds?.length ?? 0) <= 1) {
      globalNetIdsWithPortOnlyPlacements.add(placement.globalConnNetId)
    }
  }
  const globalConnMap = solver.mspConnectionPairSolver!.globalConnMap

  for (const placement of dedupedNetLabelPlacements) {
    debug(`processing placement: ${placement.netId}`)

    const placementUserNetId = globalConnMap
      .getIdsConnectedToNet(placement.globalConnNetId)
      .find((id) => userNetIdToConnKey.get(id))
    const placementConnKey = userNetIdToConnKey.get(placementUserNetId!)

    let anchor_position = placement.anchorPoint

    const orientation = placement.orientation as AxisDirection
    const anchor_side = oppositeSide(orientation)

    let sourceNet: SourceNet | undefined
    if (placementConnKey) {
      sourceNet = connKeyToSourceNet.get(placementConnKey)
    }

    const schPortIds = placement.pinIds
      .map((pinId) => pinIdToSchematicPortId.get(pinId)!)
      .filter((schPortId): schPortId is string => Boolean(schPortId))

    const hasRoutedTraceForPlacementPort = schPortIds.some((id) =>
      schematicPortIdsWithRoutedTraces.has(id),
    )

    const portsForConnKey = placementConnKey
      ? group
          .selectAll<Port>("port")
          .filter((p) => p._getSubcircuitConnectivityKey() === placementConnKey)
      : []

    const hasExplicitNetLabelForPlacementPort = (text: string) =>
      schPortIds.some((schPortId) =>
        explicitNetLabelTextsByPortId.get(schPortId)?.has(text),
      )

    const getOverlappingExplicitNetLabelIdsForSameSourceNet = (
      text: string,
      sourceNet: SourceNet,
      solverLabelCenter: Point,
    ) =>
      Array.from(explicitNetLabels.entries()).flatMap(
        ([schematicNetLabelId, explicitNetLabel]) => {
          if (explicitNetLabel.text !== text) return []
          if (explicitNetLabel.source_net_id !== sourceNet.source_net_id) {
            return []
          }
          if (!explicitNetLabel.center) return []

          const explicitBounds = getNetLabelTextBounds({
            center: explicitNetLabel.center,
            text,
          })
          const solverBounds = getNetLabelTextBounds({
            center: solverLabelCenter,
            text,
          })

          return netLabelTextBoundsOverlap(explicitBounds, solverBounds)
            ? [schematicNetLabelId]
            : []
        },
      )

    if (
      schPortIds.some((schPortId) =>
        schematicPortIdsWithPreExistingNetLabels.has(schPortId),
      )
    ) {
      debug(
        `skipping net label placement for "${placement.netId!}" REASON:schematic port has pre-existing net label`,
      )
      continue
    }

    if (sourceNet) {
      if (!hasRoutedTraceForPlacementPort) {
        anchor_position = snapPointToPinInsideExpandedBoundingBox(
          {
            point: anchor_position,
            schematicPortIds: schPortIds,
            eligiblePortIds,
          },
          db,
        )
      }

      const isPowerOrGroundNet = sourceNet.is_ground || sourceNet.is_power
      const hasExplicitPortNetTrace = connKeysWithExplicitPortNetTraces.has(
        placementConnKey!,
      )
      const hasSingleLabelPlacement =
        (netLabelPlacementCountByGlobalNetId.get(placement.globalConnNetId) ??
          0) <= 1
      const shouldSkipImplicitSignalNetLabel =
        !hasExplicitPortNetTrace &&
        !isPowerOrGroundNet &&
        hasRoutedTraceForPlacementPort &&
        hasSingleLabelPlacement

      if (shouldSkipImplicitSignalNetLabel) {
        debug(
          `skipping net label placement for "${placement.netId!}" REASON:schematic port has routed trace`,
        )
        continue
      }

      const text = sourceNet.name
      if (typeof text !== "string") {
        debug(
          `skipping net label placement for "${placement.netId!}" REASON:source net has no name`,
        )
        continue
      }

      const hasExplicitNetLabelForPlacement =
        hasExplicitNetLabelForPlacementPort(text)
      const center = computeSchematicNetLabelCenter({
        anchor_position,
        anchor_side,
        text,
      })
      if (
        !isPowerOrGroundNet &&
        !hasExplicitNetLabelForPlacement
      ) {
        const explicitIds = getOverlappingExplicitNetLabelIdsForSameSourceNet(
          text,
          sourceNet,
          center,
        )
        if (explicitIds.length > 0) {
          debug(
            `deleting explicit net label for "${placement.netId!}" REASON:overlaps solver placement for same source net`,
          )
          for (const schematic_net_label_id of explicitIds) {
            db.schematic_net_label.delete(schematic_net_label_id)
          }
        }
      }

      if (
        !isPowerOrGroundNet &&
        hasExplicitNetLabelForPlacement
      ) {
        // The explicit <netlabel> is attached to this placement's port; let the
        // solver label win so trace and label placement stay consistent.
        for (const schPortId of schPortIds) {
          const explicitIds = explicitNetLabelIdsByPortIdAndText.get(
            `${schPortId}::${text}`,
          )
          if (explicitIds) {
            for (const schematic_net_label_id of explicitIds) {
              db.schematic_net_label.delete(schematic_net_label_id)
            }
          }
        }
      }

      const netLabel: Parameters<typeof db.schematic_net_label.insert>[0] = {
        text,
        source_net_id: sourceNet.source_net_id,
        anchor_position,
        center,
        anchor_side,
        schematic_sheet_id: group._resolveSchematicSheetId(),
      }
      db.schematic_net_label.insert(netLabel)
      continue
    }

    const { name: text, wasAssignedDisplayLabel } =
      getNetNameFromPorts(portsForConnKey)
    const isRoutedPairPlacement = (placement.pinIds?.length ?? 0) > 1
    const shouldKeepRoutedPairLabel =
      isRoutedPairPlacement &&
      (globalNetIdsWithPortOnlyPlacements.has(placement.globalConnNetId) ||
        (routedPairKeysByGlobalNetId.get(placement.globalConnNetId)?.size ??
          0) > 1)

    if (
      !wasAssignedDisplayLabel &&
      !shouldKeepRoutedPairLabel &&
      schPortIds.some((schPortId) =>
        schematicPortIdsWithRoutedTraces.has(schPortId),
      )
    ) {
      debug(
        `skipping net label placement for "${placement.netId!}" REASON:schematic port has routed traces and no display label`,
      )
      continue
    }

    const center = computeSchematicNetLabelCenter({
      anchor_position,
      anchor_side,
      text,
    })

    const netLabel: Parameters<typeof db.schematic_net_label.insert>[0] = {
      text,
      source_net_id:
        placementConnKey ?? placement.netId ?? placement.globalConnNetId,
      anchor_position,
      center,
      anchor_side,
      schematic_sheet_id: group._resolveSchematicSheetId(),
    }
    db.schematic_net_label.insert(netLabel)
  }
}
