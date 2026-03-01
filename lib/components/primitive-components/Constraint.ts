import { constraintProps } from "@tscircuit/props"
import type { Distance } from "@tscircuit/props/lib/common/distance"
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
 * Extended constraint props that add centerX/centerY support for positioning
 * constrained groups/components relative to an absolute center point.
 */
const distance = z.union([z.string(), z.number()]).transform((v) => {
  if (typeof v === "number") return v
  const match = v.match(/^(-?[\d.]+)\s*(mm|cm|m|in|mil|um)?$/)
  if (!match) return Number.parseFloat(v)
  const num = Number.parseFloat(match[1])
  const unit = match[2] ?? "mm"
  switch (unit) {
    case "mm":
      return num
    case "cm":
      return num * 10
    case "m":
      return num * 1000
    case "in":
      return num * 25.4
    case "mil":
      return num * 0.0254
    case "um":
      return num / 1000
    default:
      return num
  }
})

export const extendedPcbXDistConstraintProps = z.object({
  pcb: z.literal(true).optional(),
  xDist: distance,
  left: z.string(),
  right: z.string(),
  edgeToEdge: z.literal(true).optional(),
  centerToCenter: z.literal(true).optional(),
  centerX: z.number().optional(),
  centerY: z.number().optional(),
})

export const extendedPcbYDistConstraintProps = z.object({
  pcb: z.literal(true).optional(),
  yDist: distance,
  top: z.string(),
  bottom: z.string(),
  edgeToEdge: z.literal(true).optional(),
  centerToCenter: z.literal(true).optional(),
  centerX: z.number().optional(),
  centerY: z.number().optional(),
})

export const extendedConstraintProps = z.union([
  extendedPcbXDistConstraintProps,
  extendedPcbYDistConstraintProps,
  // Keep original sameX/sameY from upstream
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
    if ("xDist" in props || "yDist" in props) {
      if (!("edgeToEdge" in props) && !("centerToCenter" in props)) {
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
