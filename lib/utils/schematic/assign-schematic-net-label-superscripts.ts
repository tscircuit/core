import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceNet } from "circuit-json"
import {
  type ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"

type NetName = SourceNet["name"]
type SourceNetworkId = keyof ConnectivityMap["netMap"]

/** Assign display suffixes during SchematicLabelNetsWithConflictingNames. */
export function assignSchematicNetLabelSuperscripts(
  db: CircuitJsonUtilObjects,
) {
  const labels = [
    ...db.schematic_net_label.list(),
    ...db.schematic_text.list().filter((text) => text.source_trace_id),
  ]
  if (labels.length === 0) return

  // Source connectivity is authoritative; PCB routing must not join source nets.
  const connMap = getFullConnectivityMapFromCircuitJson(
    db.toArray().filter((element) => element.type.startsWith("source_")),
  )
  // The full-map API omits standalone nets and standalone internal connections.
  connMap.addConnections([
    ...db.source_net.list().map((net) => [net.source_net_id]),
    ...db.source_component_internal_connection
      .list()
      .map((connection) => connection.source_port_ids),
  ])

  const labelsWithNetworks = labels.map((label) => {
    const isNetLabel = label.type === "schematic_net_label"
    const sourceTraceId =
      label.source_trace_id ??
      (isNetLabel && label.schematic_trace_id
        ? db.schematic_trace.get(label.schematic_trace_id)?.source_trace_id
        : undefined)
    const network =
      (isNetLabel
        ? connMap.getNetConnectedToId(label.source_net_id)
        : undefined) ??
      (sourceTraceId ? connMap.getNetConnectedToId(sourceTraceId) : undefined)
    return { label, network }
  })

  const networksByName = new Map<NetName, SourceNetworkId[]>()
  const addName = (name: NetName, network: SourceNetworkId | undefined) => {
    if (!name.trim() || network === undefined) return
    const networks = networksByName.get(name) ?? []
    if (!networks.includes(network)) networks.push(network)
    networksByName.set(name, networks)
  }
  // Only names displayed on multiple networks need disambiguation.
  // Unused source-net declarations must not create a visible conflict.
  for (const { label, network } of labelsWithNetworks) {
    addName(label.text, network)
  }

  // Member IDs keep numbering stable when Circuit JSON is reordered.
  const firstSourceId = (network: SourceNetworkId) =>
    [...connMap.getIdsConnectedToNet(network)].sort()[0]!
  for (const networks of networksByName.values()) {
    networks.sort((a, b) =>
      firstSourceId(a).localeCompare(firstSourceId(b), "en", { numeric: true }),
    )
  }

  for (const { label, network } of labelsWithNetworks) {
    const networks = networksByName.get(label.text) ?? []
    const display_superscript =
      network !== undefined && networks.length > 1
        ? String(networks.indexOf(network) + 1)
        : undefined
    if (label.display_superscript === display_superscript) continue
    if (label.type === "schematic_net_label") {
      db.schematic_net_label.update(label.schematic_net_label_id, {
        display_superscript,
      })
    } else {
      db.schematic_text.update(label.schematic_text_id, { display_superscript })
    }
  }
}
