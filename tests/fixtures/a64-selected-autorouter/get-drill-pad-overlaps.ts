import type { A64RepairParams } from "./repair-selected-a64"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

type DrillLocationKey = string
export type A64DrillOverlap = {
  connectionName: string
  padName: string
  x: number
  y: number
  overlapDepthMm: number
}

/** Board-world points in mm, +X right/+Y up. Through drills span every layer. */
export function getDrillPadOverlaps({
  input,
  routes,
}: {
  input: A64RepairParams["originalSrj"]
  routes: A64RepairParams["newHdRoutes"]
}): A64DrillOverlap[] {
  if (input.allowBlindAndBuriedVias || input.allowViaInPad) {
    throw new Error(
      "The frozen A64 source uses through vias without via-in-pad",
    )
  }
  const drillDiameter = input.minViaHoleDiameter
  if (drillDiameter === undefined)
    throw new Error("A64 input has no drill diameter")
  const pads = input.obstacles.filter(
    (pad) =>
      !pad.isNonPlatedHole &&
      !pad.isCopperPour &&
      pad.layers.length === 1 &&
      (pad.layers[0] === "top" || pad.layers[0] === "bottom"),
  )
  const seen = new Set<DrillLocationKey>()
  const overlaps: A64DrillOverlap[] = []
  for (const route of routes) {
    for (const via of route.vias) {
      const key = `${via.x},${via.y},${drillDiameter}`
      if (seen.has(key)) continue
      seen.add(key)
      for (const pad of pads) {
        const dx = via.x - pad.center.x
        const dy = via.y - pad.center.y
        const local = applyToPoint(
          compose(
            rotateDEG(-(pad.ccwRotationDegrees ?? 0)),
            translate(-pad.center.x, -pad.center.y),
          ),
          via,
        )
        const distance =
          pad.shape === "circle"
            ? Math.max(0, Math.hypot(dx, dy) - pad.width / 2)
            : Math.hypot(
                Math.max(0, Math.abs(local.x) - pad.width / 2),
                Math.max(0, Math.abs(local.y) - pad.height / 2),
              )
        const overlapDepthMm = drillDiameter / 2 - distance
        if (overlapDepthMm <= 1e-7) continue
        overlaps.push({
          connectionName: route.connectionName,
          padName: `${pad.circuitJsonMetadata?.source_component_name ?? "Pad"}.${pad.circuitJsonMetadata?.source_port_name ?? "unnamed"}`,
          x: via.x,
          y: via.y,
          overlapDepthMm,
        })
      }
    }
  }
  return overlaps
}
