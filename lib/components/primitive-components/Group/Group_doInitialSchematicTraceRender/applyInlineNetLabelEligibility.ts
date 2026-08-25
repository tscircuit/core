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
  explicitBranchName?: string
  netLabelText?: string
}

/**
 * Marks the direct connections that should carry an "inline net label" - the
 * net name drawn alongside the trace instead of an anchored label at its end.
 *
 * A connection qualifies when it is a genuine point-to-point signal, or when
 * one branch of a multi-terminal net has an explicit label:
 *
 * - a multi-terminal net must have exactly one explicitly named branch, so the
 *   branch label is unambiguous,
 * - the net is not power or ground (those render as rail symbols), and
 * - the label is an explicit branch name or a user-assigned point-to-point net
 *   name, rather than one derived from the ports it happens to hit.
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
  const namedBranchCountByConnKey = new Map<string, number>()
  for (const { connKey, explicitBranchName } of directConnections) {
    if (!connKey || !explicitBranchName) continue
    namedBranchCountByConnKey.set(
      connKey,
      (namedBranchCountByConnKey.get(connKey) ?? 0) + 1,
    )
  }

  for (const directConnection of directConnections) {
    const { connKey } = directConnection
    if (!connKey) continue

    const sourceNet = connKeyToSourceNet.get(connKey)
    if (sourceNet?.is_power || sourceNet?.is_ground) continue

    const portsOnNet = connKeyToSchematicPortIds.get(connKey)
    let inlineNetLabelText: string | undefined
    if (portsOnNet?.length === 2) {
      const { name, wasAssignedDisplayLabel } = resolveCanonicalNetLabelText({
        subcircuitConnectivityMapKey: connKey,
      })
      if (!name || !wasAssignedDisplayLabel) continue
      inlineNetLabelText = name
    } else if (
      portsOnNet &&
      portsOnNet.length > 2 &&
      namedBranchCountByConnKey.get(connKey) === 1
    ) {
      inlineNetLabelText = directConnection.explicitBranchName
      if (!inlineNetLabelText) continue
      directConnection.netLabelText = inlineNetLabelText
    } else {
      continue
    }

    // A trace-owned label names one routed branch, even when other branches
    // share the same electrical net.
    directConnection.allowInlineNetLabel = true
    directConnection.inlineNetLabelHeight = INLINE_NET_LABEL_FONT_SIZE
    directConnection.inlineNetLabelWidth = Number(
      getSchematicNetLabelTextWidth({
        text: inlineNetLabelText,
        font_size: INLINE_NET_LABEL_FONT_SIZE,
      }).toFixed(2),
    )
  }
}
