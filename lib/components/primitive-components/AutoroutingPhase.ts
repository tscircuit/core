import { autoroutingPhaseProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { PrimitiveComponent as PrimitiveComponentType } from "../base-components/PrimitiveComponent"

export class AutoroutingPhase extends PrimitiveComponent<
  typeof autoroutingPhaseProps
> {
  get config() {
    return {
      componentName: "AutoroutingPhase",
      zodProps: autoroutingPhaseProps,
    }
  }

  add(_component: PrimitiveComponentType) {
    throw new Error("<autoroutingphase> cannot contain children")
  }
}
