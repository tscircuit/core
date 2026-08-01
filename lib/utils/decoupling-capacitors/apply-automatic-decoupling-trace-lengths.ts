import type { Capacitor } from "lib/components/normal-components/Capacitor"
import type { Group } from "lib/components/primitive-components/Group"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { buildDecouplingSubcircuitConnectivity } from "./build-decoupling-subcircuit-connectivity"
import { capacitorHasPowerToGroundTopology } from "./capacitor-has-power-to-ground-topology"

const DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM = 1

/**
 * Detects capacitors bridging chip power-input ports and ground, then records
 * the default maximum trace length before source traces are rendered. The
 * subcircuit connectivity graph is assembled once for all of its capacitors.
 */
export function applyAutomaticDecouplingTraceLengths(group: Group<any>): void {
  if (!group.isSubcircuit) return

  const automaticCandidateCapacitors: Capacitor[] = []
  for (const capacitor of group.selectAll("capacitor") as Capacitor[]) {
    if (capacitor._parsedProps.maxDecouplingTraceLength === undefined) {
      automaticCandidateCapacitors.push(capacitor)
    }
  }
  if (automaticCandidateCapacitors.length === 0) return

  const subcircuitConnectivity = buildDecouplingSubcircuitConnectivity(
    group.selectAll("trace") as Trace[],
  )

  const { db } = group.root!
  for (const capacitor of automaticCandidateCapacitors) {
    if (!capacitor.source_component_id) continue
    if (!capacitorHasPowerToGroundTopology(capacitor, subcircuitConnectivity)) {
      continue
    }

    db.source_component.update(capacitor.source_component_id, {
      max_decoupling_trace_length: DEFAULT_MAX_DECOUPLING_TRACE_LENGTH_MM,
    })
  }
}
