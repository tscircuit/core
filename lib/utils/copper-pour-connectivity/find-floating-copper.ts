import type { AnyCircuitElement, PcbCopperPour, PcbVia } from "circuit-json"
import { PcbConnectivityMap } from "circuit-json-to-connectivity-map"

/** Find copper components with no same-net terminal or authored via.
 * Nets without terminals or authored vias retain their authored pour geometry.
 */
export const findFloatingCopper = (
  circuitJson: AnyCircuitElement[],
  generatedStitchingViaIds: ReadonlySet<PcbVia["pcb_via_id"]> = new Set(),
) => {
  const conductorComponents = new PcbConnectivityMap(
    circuitJson,
  ).getCopperConductorComponents(generatedStitchingViaIds)
  const floatingPourIds = new Set<PcbCopperPour["pcb_copper_pour_id"]>()
  const floatingViaIds = new Set<PcbVia["pcb_via_id"]>()
  const netsWithTerminals = new Set(
    conductorComponents.flatMap((conductors) =>
      conductors.some((conductor) => conductor.isTerminal)
        ? [conductors[0]!.netId]
        : [],
    ),
  )
  for (const conductors of conductorComponents) {
    if (
      !netsWithTerminals.has(conductors[0]!.netId) ||
      conductors.some((conductor) => conductor.isTerminal)
    )
      continue
    for (const conductor of conductors) {
      if (conductor.pourId) floatingPourIds.add(conductor.pourId)
      if (conductor.viaId) floatingViaIds.add(conductor.viaId)
    }
  }
  return { floatingPourIds, floatingViaIds }
}
