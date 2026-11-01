import type { SourceNet } from "circuit-json"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { SchematicPortId } from "./port-id-types"

export const INLINE_NET_LABEL_FONT_SIZE = 0.12

type EligibleDirectConnection = {
  schematicPortIds: [SchematicPortId, SchematicPortId]
  netId?: string
  netLabelWidth?: number
  anchoredNetLabelWidth?: number
  allowInlineNetLabel?: boolean
  inlineNetLabelWidth?: number
  inlineNetLabelHeight?: number
  connKey?: string
}

type EligibleNetConnection = {
  netId: string
  netLabelText?: string
  schematicPortIds: SchematicPortId[]
  netLabelWidth?: number
  anchoredNetLabelWidth?: number
  allowInlineNetLabel?: boolean
  inlineNetLabelWidth?: number
  inlineNetLabelHeight?: number
  connKey?: string
  isSameSheetCrossSectionConnection?: boolean
  isPowerOrGroundConnection?: boolean
}

type InlineNetLabelEligibleConnection = {
  anchoredNetLabelWidth?: number
  allowInlineNetLabel?: boolean
  inlineNetLabelWidth?: number
  inlineNetLabelHeight?: number
}

const markConnectionEligibleForInlineNetLabel = (
  connection: InlineNetLabelEligibleConnection,
  name: string,
) => {
  connection.anchoredNetLabelWidth ??= Number(
    getSchematicNetLabelTextWidth({ text: name }).toFixed(2),
  )
  connection.allowInlineNetLabel = true
  connection.inlineNetLabelHeight = INLINE_NET_LABEL_FONT_SIZE
  connection.inlineNetLabelWidth = Number(
    getSchematicNetLabelTextWidth({
      text: name,
      font_size: INLINE_NET_LABEL_FONT_SIZE,
    }).toFixed(2),
  )
}

/**
 * Marks connections that should carry an "inline net label" - the net name
 * drawn alongside a trace instead of an anchored label at its end.
 *
 * A direct connection qualifies when it is a genuine point-to-point signal:
 *
 * - the whole net is two ports without explicit `<netlabel>` elements,
 * - the net is not power or ground (those render as rail symbols), and
 * - the net has a name the user chose - a `schDisplayLabel`/`name` on the trace
 *   or a named net - rather than one derived from the ports it happens to hit.
 *
 * A branched signal net (more than two ports) formed by direct traces without
 * a `source_net` is also eligible when its traces specify a single unambiguous
 * `schDisplayLabel` and span multiple components. It is promoted to a
 * `netConnection` so each routed connected component receives one inline label
 * along its trace and unrouted endpoints receive outward stubs.
 *
 * A named signal net made from explicit port-to-net traces is also eligible
 * when it has either one port or ports on multiple components. A single-port
 * net renders as one outward stub. A routed component gets one label along its
 * trace, while disconnected endpoints get outward stubs. Ports with an
 * explicit `<netlabel>` element are excluded so their user-selected
 * anchored-label semantics remain intact, unless that label opts in with
 * `inline`.
 *
 * A signal crossing schematic sections on the same sheet is also eligible so
 * its separated endpoints can be visually tied together. It still follows the
 * same explicit-label and power/ground rules as every other connection.
 *
 * The solver still has the last word: it falls back to an anchored label when
 * no collision-free inline placement exists.
 */
export const applyInlineNetLabelEligibility = ({
  directConnections,
  netConnections,
  connKeyToSchematicPortIds,
  connKeyToSourceNet,
  connKeysWithExplicitPortNetTraces,
  schematicPortIdsWithExplicitNetLabels,
  schematicPortIdsWithInlineNetLabels,
  areSchematicPortsOnDifferentComponents,
  resolveCanonicalNetLabelText,
}: {
  directConnections: EligibleDirectConnection[]
  netConnections: EligibleNetConnection[]
  connKeyToSchematicPortIds: Map<string, SchematicPortId[]>
  connKeyToSourceNet: Map<string, SourceNet>
  connKeysWithExplicitPortNetTraces: Set<string>
  schematicPortIdsWithExplicitNetLabels: Set<SchematicPortId>
  schematicPortIdsWithInlineNetLabels: Set<SchematicPortId>
  areSchematicPortsOnDifferentComponents: (
    schematicPortIds: [SchematicPortId, SchematicPortId],
  ) => boolean
  resolveCanonicalNetLabelText: (args: {
    subcircuitConnectivityMapKey: string
  }) => {
    name: string
    wasAssignedDisplayLabel: boolean
    hasUnambiguousSchDisplayLabel?: boolean
  }
}) => {
  const promotedBranchedConnKeys = new Set<string>()

  for (const directConnection of directConnections) {
    const { connKey } = directConnection
    if (!connKey) continue

    const portsOnNet = connKeyToSchematicPortIds.get(connKey)
    if (!portsOnNet || portsOnNet.length < 2) continue

    const sourceNet = connKeyToSourceNet.get(connKey)
    if (sourceNet?.is_power || sourceNet?.is_ground) continue

    const { name, wasAssignedDisplayLabel, hasUnambiguousSchDisplayLabel } =
      resolveCanonicalNetLabelText({
        subcircuitConnectivityMapKey: connKey,
      })
    if (!name || !wasAssignedDisplayLabel) continue

    if (portsOnNet.length === 2) {
      markConnectionEligibleForInlineNetLabel(directConnection, name)
      continue
    }

    if (
      !sourceNet &&
      hasUnambiguousSchDisplayLabel &&
      !promotedBranchedConnKeys.has(connKey) &&
      !portsOnNet.some((schematicPortId) =>
        schematicPortIdsWithExplicitNetLabels.has(schematicPortId),
      ) &&
      !directConnections.some(
        (dc) => dc.connKey === connKey && dc.netLabelWidth !== undefined,
      )
    ) {
      const firstPortId = portsOnNet[0]
      const hasPortsOnDifferentComponents =
        firstPortId !== undefined &&
        portsOnNet
          .slice(1)
          .some((otherPortId) =>
            areSchematicPortsOnDifferentComponents([firstPortId, otherPortId]),
          )
      if (!hasPortsOnDifferentComponents) continue

      promotedBranchedConnKeys.add(connKey)
      const netLabelWidth = Number(
        getSchematicNetLabelTextWidth({ text: name }).toFixed(2),
      )
      const branchedNetConnection: EligibleNetConnection = {
        netId: directConnection.netId ?? name,
        netLabelText: name,
        schematicPortIds: [...portsOnNet],
        netLabelWidth,
        anchoredNetLabelWidth: netLabelWidth,
        connKey,
      }
      markConnectionEligibleForInlineNetLabel(branchedNetConnection, name)
      netConnections.push(branchedNetConnection)
    }
  }

  for (const netConnection of netConnections) {
    if (netConnection.allowInlineNetLabel) continue
    const { schematicPortIds } = netConnection
    const { isSameSheetCrossSectionConnection } = netConnection
    const hasInlineNetLabel = schematicPortIds.some((schematicPortId) =>
      schematicPortIdsWithInlineNetLabels.has(schematicPortId),
    )
    const isSinglePort = schematicPortIds.length === 1
    const firstSchematicPortId = schematicPortIds[0]
    const hasPortsOnDifferentComponents =
      firstSchematicPortId !== undefined &&
      schematicPortIds
        .slice(1)
        .some((otherSchematicPortId) =>
          areSchematicPortsOnDifferentComponents([
            firstSchematicPortId,
            otherSchematicPortId,
          ]),
        )
    if (
      !hasInlineNetLabel &&
      !isSameSheetCrossSectionConnection &&
      !isSinglePort &&
      !hasPortsOnDifferentComponents
    ) {
      continue
    }
    if (
      !hasInlineNetLabel &&
      schematicPortIds.some((schematicPortId) =>
        schematicPortIdsWithExplicitNetLabels.has(schematicPortId),
      )
    )
      continue
    const { connKey } = netConnection
    if (!connKey && !isSameSheetCrossSectionConnection) continue
    if (
      connKey &&
      !isSameSheetCrossSectionConnection &&
      !connKeysWithExplicitPortNetTraces.has(connKey)
    )
      continue

    const sourceNet = connKey ? connKeyToSourceNet.get(connKey) : undefined
    if (
      !hasInlineNetLabel &&
      (netConnection.isPowerOrGroundConnection ||
        sourceNet?.is_power ||
        sourceNet?.is_ground)
    ) {
      continue
    }

    let name = netConnection.netLabelText ?? ""
    let wasAssignedDisplayLabel = Boolean(name)
    if (!isSameSheetCrossSectionConnection) {
      if (!connKey) continue
      const resolvedLabel = resolveCanonicalNetLabelText({
        subcircuitConnectivityMapKey: connKey,
      })
      name = resolvedLabel.name
      wasAssignedDisplayLabel = resolvedLabel.wasAssignedDisplayLabel
    }
    if (!name || (!hasInlineNetLabel && !wasAssignedDisplayLabel)) continue

    markConnectionEligibleForInlineNetLabel(netConnection, name)
  }
}
