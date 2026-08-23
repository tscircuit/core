import type { SourceNet } from "circuit-json"
import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { SchematicPortId } from "./port-id-types"

export const INLINE_NET_LABEL_FONT_SIZE = 0.12

type EligibleDirectConnection = {
  schematicPortIds: [SchematicPortId, SchematicPortId]
  allowInlineNetLabel?: boolean
  inlineNetLabelWidth?: number
  inlineNetLabelHeight?: number
  connKey?: string
}

type EligibleNetConnection = {
  schematicPortIds: SchematicPortId[]
  allowInlineNetLabel?: boolean
  inlineNetLabelWidth?: number
  inlineNetLabelHeight?: number
  connKey?: string
}

/**
 * Marks connections that should carry an "inline net label" - the net name
 * drawn alongside a trace instead of an anchored label at its end.
 *
 * A direct connection qualifies when it is a genuine point-to-point signal:
 *
 * - the whole net is exactly these two ports (a third tap would make the label
 *   ambiguous about which leg it names),
 * - the net is not power or ground (those render as rail symbols), and
 * - the net has a name the user chose - a `schDisplayLabel`/`name` on the trace
 *   or a named net - rather than one derived from the ports it happens to hit.
 *
 * A single-port named signal net is also eligible when it comes from an
 * explicit port-to-net trace. The solver renders that as an outward trace
 * stub, so a component pin can carry an inline label without requiring a dummy
 * second chip. Ports with an explicit `<netlabel>` element are excluded so
 * their user-selected anchored-label semantics remain intact.
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
  resolveCanonicalNetLabelText,
}: {
  directConnections: EligibleDirectConnection[]
  netConnections: EligibleNetConnection[]
  connKeyToSchematicPortIds: Map<string, SchematicPortId[]>
  connKeyToSourceNet: Map<string, SourceNet>
  connKeysWithExplicitPortNetTraces: Set<string>
  schematicPortIdsWithExplicitNetLabels: Set<SchematicPortId>
  resolveCanonicalNetLabelText: (args: {
    subcircuitConnectivityMapKey: string
  }) => { name: string; wasAssignedDisplayLabel: boolean }
}) => {
  const markEligible = (
    connection: EligibleDirectConnection | EligibleNetConnection,
    name: string,
  ) => {
    connection.allowInlineNetLabel = true
    connection.inlineNetLabelHeight = INLINE_NET_LABEL_FONT_SIZE
    connection.inlineNetLabelWidth = Number(
      getSchematicNetLabelTextWidth({
        text: name,
        font_size: INLINE_NET_LABEL_FONT_SIZE,
      }).toFixed(2),
    )
  }

  for (const directConnection of directConnections) {
    const { connKey } = directConnection
    if (!connKey) continue

    const portsOnNet = connKeyToSchematicPortIds.get(connKey)
    if (portsOnNet?.length !== 2) continue

    const sourceNet = connKeyToSourceNet.get(connKey)
    if (sourceNet?.is_power || sourceNet?.is_ground) continue

    const { name, wasAssignedDisplayLabel } = resolveCanonicalNetLabelText({
      subcircuitConnectivityMapKey: connKey,
    })
    if (!name || !wasAssignedDisplayLabel) continue

    markEligible(directConnection, name)
  }

  for (const netConnection of netConnections) {
    if (netConnection.schematicPortIds.length !== 1) continue
    if (
      schematicPortIdsWithExplicitNetLabels.has(
        netConnection.schematicPortIds[0]!,
      )
    ) {
      continue
    }
    const { connKey } = netConnection
    if (!connKey) continue
    if (!connKeysWithExplicitPortNetTraces.has(connKey)) continue

    const sourceNet = connKeyToSourceNet.get(connKey)
    if (sourceNet?.is_power || sourceNet?.is_ground) continue

    const { name, wasAssignedDisplayLabel } = resolveCanonicalNetLabelText({
      subcircuitConnectivityMapKey: connKey,
    })
    if (!name || !wasAssignedDisplayLabel) continue

    markEligible(netConnection, name)
  }
}
