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

/**
 * Marks the direct connections that should carry an "inline net label" - the
 * net name drawn alongside the trace instead of an anchored label at its end.
 *
 * A connection qualifies when it is a genuine point-to-point signal:
 *
 * - the whole net is exactly these two ports (a third tap would make the label
 *   ambiguous about which leg it names),
 * - the net is not power or ground (those render as rail symbols), and
 * - the net has a name the user chose - a `schDisplayLabel`/`name` on the trace
 *   or a named net - rather than one derived from the ports it happens to hit.
 *
 * The solver still has the last word: it only emits an inline label for a
 * connection it actually routed a trace for.
 */
export const applyInlineNetLabelEligibility = ({
  directConnections,
  connKeyToSchematicPortIds,
  connKeyToSourceNet,
  resolveCanonicalNetLabelText,
}: {
  directConnections: EligibleDirectConnection[]
  connKeyToSchematicPortIds: Map<string, SchematicPortId[]>
  connKeyToSourceNet: Map<string, SourceNet>
  resolveCanonicalNetLabelText: (args: {
    subcircuitConnectivityMapKey: string
  }) => { name: string; wasAssignedDisplayLabel: boolean }
}) => {
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

    directConnection.allowInlineNetLabel = true
    directConnection.inlineNetLabelHeight = INLINE_NET_LABEL_FONT_SIZE
    directConnection.inlineNetLabelWidth = Number(
      getSchematicNetLabelTextWidth({
        text: name,
        font_size: INLINE_NET_LABEL_FONT_SIZE,
      }).toFixed(2),
    )
  }
}
