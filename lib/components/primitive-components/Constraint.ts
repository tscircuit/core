import { constraintProps } from "@tscircuit/props"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

export class Constraint extends PrimitiveComponent<typeof constraintProps> {
  get config() {
    return {
      zodProps: constraintProps,
    }
  }

  constructor(props: z.input<typeof constraintProps>) {
    super(props)
    if ("xdist" in props || "ydist" in props) {
      if (!("edgeToEdge" in props) && !("centerToCenter" in props)) {
        throw new Error(
          "edgeToEdge, centerToCenter (or from*/to* props) must be set for xdist or ydist for <constraint />",
        )
      }
    }
  }

  _getAllReferencedComponents(): {
    componentsWithSelectors: Array<{
      component: PrimitiveComponent<any>
      selector: string
    }>
  } {
    const componentsWithSelectors: Array<{
      component: PrimitiveComponent<any>
      selector: string
    }> = []

    for (const key of ["left", "right", "top", "bottom"]) {
      if (key in this._parsedProps) {
        const selector = (this._parsedProps as any)[key] as string
        const component = this.getSubcircuit().selectOne(selector)
        if (component) {
          componentsWithSelectors.push({
            selector,
            component,
          })
        }
      }
    }

    return { componentsWithSelectors }
  }
}
