import { constraintProps } from "@tscircuit/props"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

const edgeSpecifiers = [
  "leftedge",
  "rightedge",
  "topedge",
  "bottomedge",
  "center",
] as const

export type EdgeSpecifier = (typeof edgeSpecifiers)[number]

export class Constraint extends PrimitiveComponent<typeof constraintProps> {
  get config() {
    return {
      componentName: "Constraint",
      zodProps: constraintProps,
    }
  }

  constructor(props: z.input<typeof constraintProps>) {
    super(props)
    if ("xDist" in props || "ydist" in props) {
      if (!("edgeToEdge" in props) && !("centerToCenter" in props)) {
        // TODO don't throw an error if the selectors specify an edge
        throw new Error(
          `edgeToEdge, centerToCenter must be set for xDist or yDist for ${this}`,
        )
      }
    }
    if ("for" in props && props.for.length < 2) {
      throw new Error(`"for" must have at least two selectors for ${this}`)
    }
  }

  _getAllReferencedComponents(): {
    componentsWithSelectors: Array<{
      component: PrimitiveComponent<any>
      selector: string
      componentSelector: string
      edge: EdgeSpecifier | undefined
    }>
  } {
    const componentsWithSelectors: Array<{
      component: PrimitiveComponent<any>
      selector: string
      componentSelector: string
      edge: EdgeSpecifier | undefined
    }> = []

    const container = this.getPrimitiveContainer()!

    function addComponentFromSelector(selector: string) {
      // TODO this selector has to be modified in case it contains a leftedge,
      // center/topedge/rightedge indicator
      const maybeEdge = selector.split(" ").pop() as EdgeSpecifier
      const edge = edgeSpecifiers.includes(maybeEdge) ? maybeEdge : undefined
      const componentSelector = edge
        ? selector.replace(` ${edge}`, "")
        : selector
      const component = container.selectOne(componentSelector, {
        pcbPrimitive: true,
      })
      if (component) {
        componentsWithSelectors.push({
          selector,
          component,
          componentSelector,
          edge,
        })
      }
    }

    for (const key of ["left", "right", "top", "bottom"]) {
      if (key in this._parsedProps) {
        addComponentFromSelector((this._parsedProps as any)[key] as string)
      }
    }

    if ("for" in this._parsedProps) {
      for (const selector of this._parsedProps.for) {
        addComponentFromSelector(selector)
      }
    }

    return { componentsWithSelectors }
  }
}
