import { getSvgFromGraphicsObject, type GraphicsObject } from "graphics-debug"
import type { A64RepairParams } from "./repair-selected-a64"
import type { A64DrillOverlap } from "./get-drill-pad-overlaps"

function isA64RamViewPoint(point: { x: number; y: number }): boolean {
  return Math.abs(point.x - 132.4) <= 1.6 && Math.abs(point.y + 85.4) <= 1.25
}

/** Crop the drawing only. Coordinates are board-world mm, +X right/+Y up. */
export function getA64RepairSvg({
  input,
  routes,
  overlaps,
}: {
  input: A64RepairParams["originalSrj"]
  routes: A64RepairParams["newHdRoutes"]
  overlaps: A64DrillOverlap[]
}): string {
  const pads = input.obstacles.filter(
    (pad) => pad.layers.includes("top") && isA64RamViewPoint(pad.center),
  )
  const graphics: GraphicsObject = {
    circles: pads
      .filter((pad) => pad.shape === "circle")
      .map((pad) => ({
        center: pad.center,
        radius: pad.width / 2,
        fill: "#fecaca",
        stroke: "#991b1b",
      })),
    rects: pads
      .filter((pad) => pad.shape !== "circle")
      .map((pad) => ({
        center: pad.center,
        width: pad.width,
        height: pad.height,
        ccwRotationDegrees: pad.ccwRotationDegrees,
        fill: "#fecaca",
        stroke: "#991b1b",
      })),
    lines: [],
    texts: pads.map((pad) => ({
      x: pad.center.x,
      y: pad.center.y + pad.height / 2 + 0.09,
      text: pad.circuitJsonMetadata?.source_port_name ?? "Pad",
      fontSize: 0.09,
    })),
  }
  for (const route of routes) {
    for (let index = 0; index < route.route.length - 1; index++) {
      const point = route.route[index]!
      const next = route.route[index + 1]!
      if (
        !isA64RamViewPoint(point) ||
        !isA64RamViewPoint(next) ||
        point.z !== next.z
      )
        continue
      graphics.lines!.push({
        points: [point, next],
        strokeWidth: route.traceThickness,
        strokeColor: point.z === 0 ? "#dc2626" : "#2563eb",
        ...(point.z === 0 ? {} : { strokeDash: [0.035, 0.035] }),
      })
    }
    for (const via of route.vias) {
      if (!isA64RamViewPoint(via)) continue
      graphics.circles!.push({
        center: via,
        radius: route.viaDiameter / 2,
        fill: "#ddd6fe",
        stroke: "#5b21b6",
      })
      graphics.circles!.push({
        center: via,
        radius: input.minViaHoleDiameter! / 2,
        fill: "white",
        stroke: "#111827",
      })
    }
  }
  graphics.texts!.push(
    {
      x: 132.4,
      y: -83.75,
      text: `A64 repair replay: ${input.connections.length} signals / ${input.obstacles.length} pads / ${input.layerCount} layers`,
      fontSize: 0.13,
    },
    {
      x: 132.4,
      y: -83.98,
      text: `Whole-sample drill/pad DRC findings: ${overlaps.length}`,
      fontSize: 0.13,
    },
    {
      x: 132.4,
      y: -84.19,
      text: "Source drill: 0.2 mm. Annular-pad clearance is checked separately.",
      fontSize: 0.1,
    },
  )
  return getSvgFromGraphicsObject(graphics, {
    backgroundColor: "white",
    svgWidth: 1200,
    svgHeight: 900,
  })
}
