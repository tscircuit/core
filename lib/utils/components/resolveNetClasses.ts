import type { Net } from "lib/components/primitive-components/Net"
import type { NetClass } from "lib/components/primitive-components/NetClass"

/** Match explicit net selectors in the net's own subcircuit. Lower priority
 * numbers win; Default always supplies the final fallback, as in KiCad. */
export function resolveNetClasses(net: Net): NetClass[] {
  return net
    .getSubcircuit()
    .selectAll<NetClass>("netclass")
    .filter(
      (netClass) =>
        netClass.name === "Default" ||
        netClass._parsedProps.nets.includes(net.getPortSelector()),
    )
    .sort((a, b) => {
      if (a.name === "Default") return 1
      if (b.name === "Default") return -1
      const priorityDifference =
        (a._parsedProps.priority ?? 0) - (b._parsedProps.priority ?? 0)
      if (priorityDifference !== 0) return priorityDifference
      if (a.name! < b.name!) return -1
      if (a.name! > b.name!) return 1
      return 0
    })
}
