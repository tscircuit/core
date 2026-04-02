import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Net } from "lib/components/primitive-components/Net"

export const createNetsFromProps = (
  component: PrimitiveComponent,
  props: (string | undefined | null)[],
) => {
  for (const prop of props) {
    if (typeof prop === "string" && prop.startsWith("net.")) {
      if (/net\.[^\s>]*\./.test(prop)) {
        throw new Error(
          'Net names cannot contain a period. Use "sel.net.V3_3" for common nets or \'sel.net<"CUSTOM_NET">().CUSTOM_NET\' for custom nets.',
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
      if (!subcircuit.selectOne(prop)) {
        const net = new Net({
          name: prop.split("net.")[1],
        })
        subcircuit.add(net)
      }
    }
  }
}
