import type { SourceTrace } from "circuit-json"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { InflatorContext } from "../InflatorFn"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

const getSelectorPath = (
  component: { name: string; source_group_id: string | undefined },
  db: CircuitJsonUtilObjects,
): string => {
  const path_parts: string[] = []
  let currentGroupId = component.source_group_id
  while (currentGroupId) {
    const group = db.source_group.get(currentGroupId)
    if (!group) break
    path_parts.unshift(`.${group.name}`)
    currentGroupId = group.parent_source_group_id
  }
  path_parts.push(`.${component.name}`)
  return path_parts.join(" > ")
}

export function inflateSourceTrace(
  sourceTrace: SourceTrace,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit } = inflatorContext

  const connectedSelectors: string[] = []

  // Get selectors for connected ports
  for (const sourcePortId of sourceTrace.connected_source_port_ids) {
    const sourcePort = injectionDb.source_port.get(sourcePortId)
    if (!sourcePort) continue

    let selector: string | undefined
    if (sourcePort.source_component_id) {
      const sourceComponent = injectionDb.source_component.get(
        sourcePort.source_component_id,
      )
      if (sourceComponent) {
        // This is a port on a component, e.g. .G1 > .R1 > .pin1
        const path = getSelectorPath(
          {
            name: sourceComponent.name,
            source_group_id: sourceComponent.source_group_id,
          },
          injectionDb,
        )
        selector = `${path} > .${sourcePort.name}`
      }
    } else {
      // This is a port on a group, usually the root group of the subcircuit.
      // e.g. .P1
      selector = `.${sourcePort.name}`
    }

    if (selector) {
      connectedSelectors.push(selector)
    }
  }

  // Get selectors for connected nets
  for (const sourceNetId of sourceTrace.connected_source_net_ids) {
    const sourceNet = injectionDb.source_net.get(sourceNetId)
    if (sourceNet) {
      connectedSelectors.push(`net.${sourceNet.name}`)
    }
  }

  if (connectedSelectors.length < 2) return

  const trace = new Trace({
    path: connectedSelectors,
  })

  // Set source_trace_id on the new trace
  trace.source_trace_id = sourceTrace.source_trace_id

  subcircuit.add(trace)
}
