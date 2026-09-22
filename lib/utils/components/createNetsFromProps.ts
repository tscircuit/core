import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Net } from "lib/components/primitive-components/Net"

// Key the index by the cached selectAll result. Tree mutations invalidate that
// array, so added/removed nets (including nets in ordinary groups) rebuild it.
type NetSelector = `net.${string}`
const netSelectorsByNets = new WeakMap<Net[], Set<NetSelector>>()

const hasNet = (subcircuit: PrimitiveComponent, selector: string) => {
  if (!/^net\.[A-Za-z_][A-Za-z0-9_]*$/.test(selector)) {
    return Boolean(subcircuit.selectOne(selector))
  }
  const nets = subcircuit.selectAll<Net>("net")
  let netSelectors = netSelectorsByNets.get(nets)
  if (!netSelectors) {
    netSelectors = new Set<NetSelector>()
    for (const net of nets) {
      // CSS class selectors match individual whitespace-separated aliases.
      for (const alias of net.getNameAndAliases().join(" ").split(/\s+/)) {
        netSelectors.add(`net.${alias}`)
      }
    }
    netSelectorsByNets.set(nets, netSelectors)
  }
  return netSelectors.has(selector as NetSelector)
}

export const createNetsFromProps = (
  component: PrimitiveComponent,
  props: (string | undefined | null)[],
) => {
  for (const prop of props) {
    if (typeof prop === "string" && prop.startsWith("net.")) {
      if (/net\.[^\s>]*\./.test(prop)) {
        throw new Error(
          'Net names cannot contain a period, try using "sel.net..." to autocomplete with conventional net names, e.g. V3_3',
        )
      }
      if (/net\.[^\s>]*[+-]/.test(prop)) {
        const netName = prop.split("net.")[1]
        const message =
          `Net names cannot contain "+" or "-" (component "${component.componentName}" received "${netName}" via "${prop}"). ` +
          `Try using underscores instead, e.g. VCC_P`
        throw new Error(message)
      }
      if (/net\.[0-9]/.test(prop)) {
        const netName = prop.split("net.")[1]
        throw new Error(
          `Net name "${netName}" cannot start with a number, try using a prefix like "VBUS1"`,
        )
      }
      const subcircuit = component.getSubcircuit()
      if (!hasNet(subcircuit, prop)) {
        const net = new Net({
          name: prop.split("net.")[1],
        })
        subcircuit.add(net)
      }
    }
  }
}
