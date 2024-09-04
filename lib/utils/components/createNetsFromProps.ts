import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Net } from "lib/components/primitive-components/Net"

export const createNetsFromProps = (
  component: PrimitiveComponent,
  props: (string | undefined | null)[],
) => {
  for (const prop of props) {
    if (typeof prop === "string" && prop.startsWith("net.")) {
      if (!component.getSubcircuit().selectOne(prop)) {
        component.getSubcircuit().add(new Net({ name: prop.split("net.")[1] }))
      }
    }
  }
}
