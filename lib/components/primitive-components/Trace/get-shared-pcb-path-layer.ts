import type { PcbPath } from "@tscircuit/props"
import type { LayerRef } from "circuit-json"
import type { ISubcircuit } from "../Group/Subcircuit/ISubcircuit"
import type { Port } from "../Port"

/**
 * Choose a copper layer shared by every physical contact on a path without
 * vias, preserving the first contact's layer preference as pcbStraightLine
 * does. PCB layers refer to the board's Z stack, independently of XY placement.
 * A pcbPaths placement anchor can be only a coordinate origin; callers pass
 * physical endpoint ports separately from selector contacts in the path.
 */
export const getSharedPcbPathLayer = ({
  path,
  connectedPorts,
  subcircuit,
}: {
  path: PcbPath
  connectedPorts: Port[]
  subcircuit: Pick<ISubcircuit, "selectOne">
}): LayerRef | undefined => {
  // Explicit vias already define the path's layer transitions.
  if (path.some((point) => typeof point !== "string" && point.via)) return

  const selectorPorts = path.flatMap((point) => {
    if (typeof point !== "string") return []
    const port = subcircuit.selectOne(point, { type: "port" }) as
      | Port
      | undefined
    // The renderer reports unresolved selectors with the existing diagnostic.
    return port ? [port] : []
  })
  const [firstPort, ...otherPorts] = [...connectedPorts, ...selectorPorts]
  return firstPort
    ?.getAvailablePcbLayers()
    .find((layer) =>
      otherPorts.every((port) => port.getAvailablePcbLayers().includes(layer)),
    ) as LayerRef | undefined
}
