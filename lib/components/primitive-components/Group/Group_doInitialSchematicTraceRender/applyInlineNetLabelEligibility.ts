import type { SourceNet } from "circuit-json"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { SchematicPortId } from "./port-id-types"

export const INLINE_NET_LABEL_FONT_SIZE = 0.12

type EligibleDirectConnection = {
  schematicPortIds: [SchematicPortId, SchematicPortId]
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
 * A direct connection qualifies when it is a genuine point-to-point signal,
 * or when the user explicitly names a trace on the branched net:
 *
 * - the whole net is exactly these two ports, or one of its traces has an
 *   explicit `name` showing that the branched net is intentionally named,
 * - the net is not power or ground (those render as rail symbols), and
 * - the net has a name the user chose - a `schDisplayLabel`/`name` on the trace
 *   or a named net - rather than one derived from the ports it happens to hit.
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
  connKeysWithExplicitNamedTraces,
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
  connKeysWithExplicitNamedTraces: Set<string>
  connKeysWithExplicitPortNetTraces: Set<string>
  schematicPortIdsWithExplicitNetLabels: Set<SchematicPortId>
  schematicPortIdsWithInlineNetLabels: Set<SchematicPortId>
  areSchematicPortsOnDifferentComponents: (
    schematicPortIds: [SchematicPortId, SchematicPortId],
  ) => boolean
  resolveCanonicalNetLabelText: (args: {
    subcircuitConnectivityMapKey: string
  }) => { name: string; wasAssignedDisplayLabel: boolean }
}) => {
  for (const directConnection of directConnections) {
    const { connKey } = directConnection
    if (!connKey) continue

    const portsOnNet = connKeyToSchematicPortIds.get(connKey)
    if (
      portsOnNet?.length !== 2 &&
      !connKeysWithExplicitNamedTraces.has(connKey)
    )
      continue

    const sourceNet = connKeyToSourceNet.get(connKey)
    if (sourceNet?.is_power || sourceNet?.is_ground) continue

    const { name, wasAssignedDisplayLabel } = resolveCanonicalNetLabelText({
      subcircuitConnectivityMapKey: connKey,
    })
    if (!name || !wasAssignedDisplayLabel) continue

    markConnectionEligibleForInlineNetLabel(directConnection, name)
  }

  for (const netConnection of netConnections) {
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
