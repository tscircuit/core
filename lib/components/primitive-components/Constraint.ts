import { constraintProps } from "@tscircuit/props"
import { distance } from "circuit-json"
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

/**
 * Extended constraint props that add centerX/centerY for absolute positioning
 * of constraint clusters. These will be upstreamed to @tscircuit/props.
 */
export const extendedConstraintProps = z.union([
  z.object({
    pcb: z.literal(true).optional(),
    xDist: distance,
    left: z.string(),
    right: z.string(),
    edgeToEdge: z.literal(true).optional(),
    centerToCenter: z.literal(true).optional(),
    centerX: distance.optional(),
    centerY: distance.optional(),
  }),
  z.object({
    pcb: z.literal(true).optional(),
    yDist: distance,
    top: z.string(),
    bottom: z.string(),
    edgeToEdge: z.literal(true).optional(),
    centerToCenter: z.literal(true).optional(),
    centerX: distance.optional(),
    centerY: distance.optional(),
  }),
  z.object({
    pcb: z.literal(true).optional(),
    sameY: z.literal(true).optional(),
    for: z.array(z.string()),
  }),
  z.object({
    pcb: z.literal(true).optional(),
    sameX: z.literal(true).optional(),
    for: z.array(z.string()),
  }),
])

export class Constraint extends PrimitiveComponent<
  typeof extendedConstraintProps
> {
  get config() {
    return {
      componentName: "Constraint",
      zodProps: extendedConstraintProps,
    }
  }

  constructor(props: z.input<typeof extendedConstraintProps>) {
    super(props)
    if ("xdist" in props || "ydist" in props) {
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
