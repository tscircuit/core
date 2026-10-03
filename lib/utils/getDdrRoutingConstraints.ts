import type { PcbDdrRouting } from "@tscircuit/props"
import type { DdrRoutingConstraints } from "circuit-json"

/** Persist author intent after selector resolution; never infer DDR roles from
 * trace names or supply missing electrical/physical values. */
export function getDdrRoutingConstraints(
  intent?: PcbDdrRouting,
): DdrRoutingConstraints | undefined {
  if (!intent) return
  return {
    profile: intent.profile,
    interface_name: intent.interfaceName,
    signal_class: intent.signalClass,
    topology: intent.topology,
    byte_index: intent.byteIndex,
    ground_net_name: intent.groundNetName,
    power_net_name: intent.powerNetName,
  }
}
