import type { Net } from "lib/components/primitive-components/Net"

export type NetSelector = `net.${string}`
// selectAll returns the same scoped array until an ancestor tree mutation
// invalidates it. Weak keys let obsolete indexes be collected with that array.
const netsBySelectorByNets = new WeakMap<Net[], Map<NetSelector, Net>>()

export const selectNetByLiteralSelector = (
  nets: Net[],
  selector: NetSelector,
): Net | null => {
  let netsBySelector = netsBySelectorByNets.get(nets)
  if (!netsBySelector) {
    netsBySelector = new Map<NetSelector, Net>()
    for (const net of nets) {
      for (const alias of net.getNameAndAliases().join(" ").split(/\s+/)) {
        const netSelector: NetSelector = `net.${alias}`
        // Match CSS selectOne's first match when aliases/names overlap.
        if (!netsBySelector.has(netSelector))
          netsBySelector.set(netSelector, net)
      }
    }
    netsBySelectorByNets.set(nets, netsBySelector)
  }
  return netsBySelector.get(selector) ?? null
}
