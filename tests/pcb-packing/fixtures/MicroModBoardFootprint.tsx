import React, { type ReactElement } from "react"
import type { SmtPadProps, PlatedHoleProps } from "@tscircuit/props"

// ---------- Helpers ----------
const createSmtPad = (props: SmtPadProps): ReactElement =>
  React.createElement("smtpad", props as any)

const createPlatedHole = (props: PlatedHoleProps): ReactElement =>
  React.createElement("platedhole", props as any)

interface MicroModBoardFootprintProps {
  variant?: "processor" | "function"
}

export const MicroModBoardFootprint: React.FC<MicroModBoardFootprintProps> = ({
  variant = "processor",
}) => {
  const padWidth = 0.35
  const topPadHeight = 1.45
  const bottomPadHeight = 1.95
  const pitch = 0.5
  const pcbYValue = variant === "processor" ? -9.725 : -31.225

  const generatePads = () => {
    const pads: ReactElement[] = []

    // Top row (odd pins, right to left) → starts at 5.25 and ends at -9.25
    let x = 9.25
    for (let pn = 1; pn <= 75; pn += 2) {
      if (pn >= 24 && pn <= 31) {
        x -= pitch
        continue // skip nonexistent pins but keep spacing
      }
      pads.push(
        createSmtPad({
          portHints: [`pin${pn}`],
          width: padWidth,
          height: topPadHeight,
          pcbX: x,
          pcbY: pcbYValue,
          layer: "top",
          shape: "rect",
        }),
      )
      x -= pitch
    }

    // Bottom row (even pins, right to left) → starts at 9 and ends at -9
    x = 9
    for (let pn = 2; pn <= 74; pn += 2) {
      if (pn >= 24 && pn <= 31) {
        x -= pitch
        continue // skip nonexistent pins but keep spacing
      }
      pads.push(
        createSmtPad({
          portHints: [`pin${pn}`],
          width: padWidth,
          height: bottomPadHeight,
          pcbX: x,
          pcbY: pcbYValue + 0.25,
          layer: "bottom",
          shape: "rect",
        }),
      )
      x -= pitch
    }

    return pads
  }

  const mountingHoles =
    variant === "function"
      ? [
          createPlatedHole({
            portHints: ["HOLE_PAD_1"],
            holeDiameter: 3.82,
            outerDiameter: 5.62,
            pcbX: -19,
            pcbY: 11.5,
            shape: "circle",
          }),
          createPlatedHole({
            portHints: ["HOLE_PAD_2"],
            holeDiameter: 3.82,
            outerDiameter: 5.62,
            pcbX: 19,
            pcbY: 11.5,
            shape: "circle",
          }),
        ]
      : createPlatedHole({
          portHints: ["HOLE_PAD_1"],
          holeDiameter: 3.82,
          outerDiameter: 5.62,
          pcbX: 4.2,
          pcbY: 11,
          shape: "circle",
        })

  return (
    <footprint>
      {generatePads()}
      {Array.isArray(mountingHoles) ? mountingHoles : [mountingHoles]}
    </footprint>
  )
}
