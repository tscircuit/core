import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceNet } from "circuit-json"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"

type NetName = SourceNet["name"]
// ConnectivityMap currently exports network identifiers only through this API.
type SourceNetworkId = Exclude<
  ReturnType<ConnectivityMap["getNetConnectedToId"]>,
  undefined
>

/**
 * Disambiguate names using source electrical connectivity across all subcircuits.
 * Run after rendering settles, including after cached subcircuits are inflated.
 * Suffixes are derived display metadata; source names and connectivity stay intact.
 */
export function assignSchematicNetLabelSuperscripts(
  db: CircuitJsonUtilObjects,
) {
  const schematicNetLabels = db.schematic_net_label.list()
  const inlineNetLabels = db.schematic_text
    .list()
    .filter((text) => text.source_trace_id !== undefined)
  if (schematicNetLabels.length === 0 && inlineNetLabels.length === 0) return

  const connectivity = new ConnectivityMap({})
  connectivity.addConnections([
    ...db.source_net.list().map((net) => [net.source_net_id]),
    ...db.source_trace
      .list()
      .map((trace) => [
        trace.source_trace_id,
        ...trace.connected_source_net_ids,
        ...trace.connected_source_port_ids,
      ]),
    ...db.source_component
      .list()
      .flatMap(
        (component) => component.internally_connected_source_port_ids ?? [],
      ),
    ...db.source_component_internal_connection
      .list()
      .map((connection) => connection.source_port_ids),
  ])

  const networksByName = new Map<NetName, Set<SourceNetworkId>>()
  const addName = (name: NetName, network: SourceNetworkId | undefined) => {
    if (!name.trim() || network === undefined) return
    const networks = networksByName.get(name) ?? new Set<SourceNetworkId>()
    networks.add(network)
    networksByName.set(name, networks)
  }

  for (const net of db.source_net.list()) {
    addName(net.name, connectivity.getNetConnectedToId(net.source_net_id))
  }

  const netLabels = schematicNetLabels.map((label) => {
    const sourceTraceId =
      label.source_trace_id ??
      (label.schematic_trace_id
        ? db.schematic_trace.get(label.schematic_trace_id)?.source_trace_id
        : undefined)
    const network =
      connectivity.getNetConnectedToId(label.source_net_id) ??
      (sourceTraceId
        ? connectivity.getNetConnectedToId(sourceTraceId)
        : undefined)
    addName(label.text, network)
    return { label, network }
  })
  const inlineLabels = inlineNetLabels.map((label) => {
    const network = connectivity.getNetConnectedToId(label.source_trace_id!)
    addName(label.text, network)
    return { label, network }
  })

  const superscriptsByName = new Map<NetName, Map<SourceNetworkId, string>>()
  for (const [name, networks] of networksByName) {
    if (networks.size < 2) continue
    // Use a network's member IDs, not the connectivity library's generated net
    // number, so reordering Circuit JSON does not change the suffix assignment.
    const orderedNetworks = [...networks]
      .map((network) => ({
        network,
        firstSourceId: [
          ...connectivity.getIdsConnectedToNet(network),
        ].sort()[0]!,
      }))
      .sort((a, b) =>
        a.firstSourceId.localeCompare(b.firstSourceId, "en", { numeric: true }),
      )
    superscriptsByName.set(
      name,
      new Map(
        orderedNetworks.map(({ network }, index) => [
          network,
          String(index + 1),
        ]),
      ),
    )
  }
  for (const { label, network } of netLabels) {
    const display_superscript =
      network === undefined
        ? undefined
        : superscriptsByName.get(label.text)?.get(network)
    if (label.display_superscript !== display_superscript) {
      db.schematic_net_label.update(label.schematic_net_label_id, {
        display_superscript,
      })
    }
  }
  for (const { label, network } of inlineLabels) {
    const display_superscript =
      network === undefined
        ? undefined
        : superscriptsByName.get(label.text)?.get(network)
    if (label.display_superscript !== display_superscript) {
      db.schematic_text.update(label.schematic_text_id, { display_superscript })
    }
  }
}
