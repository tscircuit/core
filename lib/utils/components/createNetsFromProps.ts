import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Net } from "lib/components/primitive-components/Net"
import { getInvalidNetNameError } from "lib/utils/nets/getInvalidNetNameError"
import { reportInvalidNetName } from "lib/utils/nets/reportInvalidNetName"

export const createNetsFromProps = (
  component: PrimitiveComponent,
  props: (string | undefined | null)[],
) => {
  for (const prop of props) {
    if (typeof prop === "string" && prop.startsWith("net.")) {
      const invalidNetNameError = getInvalidNetNameError(
        prop,
        () => component.componentName,
      )
      if (invalidNetNameError) {
        // Surface the bad net name as a recoverable error instead of throwing
        // (which would abort the entire render). We still skip creating the net
        // because its name cannot be represented as a valid selector.
        reportInvalidNetName(component, prop, invalidNetNameError)
        continue
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
