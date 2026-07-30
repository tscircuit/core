import type { FanoutPourNetMap } from "@tscircuit/props"
import type { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { CopperPour } from "../CopperPour/CopperPour"
import type { Group } from "./Group"
import type { RoutingPhasePlan } from "./GroupRoutingPhasePlan"
import type { ISubcircuit } from "./Subcircuit/ISubcircuit"

const addPourNetMap = (
  target: Map<string, Set<string>>,
  pourNetMap: FanoutPourNetMap,
) => {
  for (const [layer, netOrNets] of Object.entries(pourNetMap)) {
    if (!netOrNets) continue
    const nets = Array.isArray(netOrNets) ? netOrNets : [netOrNets]
    const layerNets = target.get(layer) ?? new Set<string>()
    for (const net of nets) layerNets.add(net)
    target.set(layer, layerNets)
  }
}

const toFanoutPourNetMap = (
  netsByLayer: Map<string, Set<string>>,
): FanoutPourNetMap =>
  Object.fromEntries(
    Array.from(netsByLayer, ([layer, nets]) => [
      layer,
      nets.size === 1 ? Array.from(nets)[0]! : Array.from(nets),
    ]),
  )

/**
 * Gets the plane intent for fanout routing. An explicit phase map is
 * authoritative. When no phase supplies one, copper pours in the current or
 * enclosing subcircuits are used.
 */
export const Group_getFanoutPourNetMap = (
  group: Group<any>,
  routingPhasePlans: RoutingPhasePlan[],
): FanoutPourNetMap | undefined => {
  const explicitMaps = routingPhasePlans
    .map((plan) => plan.fanoutPourNetMap)
    .filter((map): map is FanoutPourNetMap => map !== undefined)

  const netsByLayer = new Map<string, Set<string>>()
  if (explicitMaps.length > 0) {
    for (const explicitMap of explicitMaps) {
      addPourNetMap(netsByLayer, explicitMap)
    }
    return toFanoutPourNetMap(netsByLayer)
  }

  let scope: PrimitiveComponent | null = group
  while (scope) {
    if (scope.isSubcircuit) {
      const subcircuit = scope as unknown as ISubcircuit
      const copperPours = subcircuit.selectAll<CopperPour>("copperpour")
      for (const copperPour of copperPours) {
        if (copperPour.getSubcircuit() !== subcircuit) continue
        const { layer, connectsTo } = copperPour._parsedProps
        addPourNetMap(netsByLayer, {
          [layer]: connectsTo,
        })
      }
    }
    scope = scope.parent
  }

  return netsByLayer.size > 0 ? toFanoutPourNetMap(netsByLayer) : undefined
}
