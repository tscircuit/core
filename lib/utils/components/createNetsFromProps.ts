import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Net } from "lib/components/primitive-components/Net"

export const createNetsFromProps = (
  component: PrimitiveComponent,
  props: (string | undefined | null)[],
) => {
  for (const prop of props) {
    if (typeof prop === "string" && prop.startsWith("net.")) {
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
