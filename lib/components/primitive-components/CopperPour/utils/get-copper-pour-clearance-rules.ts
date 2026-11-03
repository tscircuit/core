import type { CopperPourClearanceRule } from "circuit-json"
import type { Net } from "../../Net"
import type { CopperPour } from "../CopperPour"

export function getCopperPourClearanceRules(
  copperPour: CopperPour,
): CopperPourClearanceRule[] | undefined {
  const subcircuit = copperPour.getSubcircuit()
  return copperPour._parsedProps.clearanceRules?.map((rule) => ({
    clearance: rule.clearance,
    ...(rule.objectTypes ? { object_types: rule.objectTypes } : {}),
    ...(rule.netSelectors
      ? {
          source_net_ids: rule.netSelectors.map((selector) => {
            const net = subcircuit.selectOne<Net>(selector)
            if (!net?.source_net_id) {
              throw new Error(
                `Copper pour clearance target "${selector}" does not match a net`,
              )
            }
            return net.source_net_id
          }),
        }
      : {}),
  }))
}
