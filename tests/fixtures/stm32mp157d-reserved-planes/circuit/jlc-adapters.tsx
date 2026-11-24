import React from "react"
import { jlcPart } from "./jlc-registry"
/** Exact supplier pad/courtyard geometry and CAD are retained. Supplier decorative
 * silkscreen strokes/text are omitted for dense-board readability and rendering cost.
 * Imported thermal vias connect to GND. Filled/capped via-in-pad is required.
 */
const cache = new Map<string, any>()
export function modelFor(mpn: string): any {
  if (cache.has(mpn)) return cache.get(mpn)
  const p = jlcPart(mpn)
  const groundPin = (
    { LM5176PWPR: "pin29", TPS3431SDRBR: "pin9" } as Record<string, string>
  )[mpn]
  const children = React.Children.toArray(p.footprint.props.children)
    .filter(
      (n: any) =>
        !["silkscreenpath", "silkscreentext", "fabricationnotepath"].includes(
          n.type,
        ),
    )
    .map((node: any, i) =>
      node.type === "via" && groundPin
        ? React.cloneElement(node, {
            key: `thermal-${i}`,
            connectsTo: "net.GND",
            outerDiameter: 0.6,
            holeDiameter: 0.3,
            doNotPlace: true,
          })
        : node,
    )
  const result = {
    ...p,
    footprint: (
      <footprint
        insertionDirection={mpn.startsWith("PM254") ? "from_above" : undefined}
      >
        {children}
      </footprint>
    ),
  }
  cache.set(mpn, result)
  return result
}
