import { warnIfAutorouterTraceClearanceIsSet } from "lib/utils/autorouting/warn-if-autorouter-trace-clearance-is-set"
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

  doInitialSourceRender() {
    warnIfAutorouterTraceClearanceIsSet(this, this._parsedProps.autorouter)
  }

  add(_component: PrimitiveComponentType) {
    throw new Error("<autoroutingphase> cannot contain children")
  }
}
