import type { AnyCircuitElement } from "circuit-json"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { SilkscreenPath } from "lib/components/primitive-components/SilkscreenPath"
import { PlatedHole } from "lib/components/primitive-components/PlatedHole"
import { Keepout } from "lib/components/primitive-components/Keepout"
import { Hole } from "lib/components/primitive-components/Hole"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import { createPinrowSilkscreenText } from "./createPinrowSilkscreenText"
import type { PinLabelsProp } from "@tscircuit/props"

export const createComponentsFromCircuitJson = (
  {
    componentName,
    componentRotation,
    footprint,
    pinLabels,
  }: {
    componentName: string
    componentRotation: string
    footprint: string
    pinLabels: PinLabelsProp
  },
  soup: AnyCircuitElement[],
): PrimitiveComponent[] => {
  const components: PrimitiveComponent[] = []
  for (const elm of soup) {
    if (elm.type === "pcb_smtpad" && elm.shape === "rect") {
      components.push(
        new SmtPad({
          pcbX: elm.x,
          pcbY: elm.y,
          layer: elm.layer,
          shape: "rect",
          height: elm.height,
          width: elm.width,
          portHints: elm.port_hints,
        }),
      )
    } else if (elm.type === "pcb_smtpad" && elm.shape === "circle") {
      components.push(
        new SmtPad({
          pcbX: elm.x,
          pcbY: elm.y,
          layer: elm.layer,
          shape: "circle",
          radius: elm.radius,
          portHints: elm.port_hints,
        }),
      )
    } else if (elm.type === "pcb_silkscreen_path") {
      components.push(
        new SilkscreenPath({
          layer: elm.layer,
          route: elm.route,
          strokeWidth: elm.stroke_width,
        }),
      )
    } else if (elm.type === "pcb_plated_hole" && elm.shape === "circle") {
      if (elm.shape === "circle") {
        components.push(
          new PlatedHole({
            pcbX: elm.x,
            pcbY: elm.y,
            shape: "circle",
            holeDiameter: elm.hole_diameter,
            outerDiameter: elm.outer_diameter,
            portHints: elm.port_hints,
          }),
        )
      }
    } else if (elm.type === "pcb_keepout" && elm.shape === "circle") {
      components.push(
        new Keepout({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          shape: "circle",
          radius: elm.radius,
        }),
      )
    } else if (elm.type === "pcb_keepout" && elm.shape === "rect") {
      components.push(
        new Keepout({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          shape: "rect",
          width: elm.width,
          height: elm.height,
        }),
      )
    } else if (elm.type === "pcb_hole" && elm.hole_shape === "circle") {
      components.push(
        new Hole({
          pcbX: elm.x,
          pcbY: elm.y,
          diameter: elm.hole_diameter,
        }),
      )
    } else if (elm.type === "pcb_silkscreen_text") {
      let readableRotation = componentRotation ? parseInt(componentRotation) : 0
      // Normalize the angle between 0 and 360 degrees.
      const normalizedRotation = ((readableRotation % 360) + 360) % 360
      // If the angle makes the text upside down, flip it so that it reads correctly.
      const isUpsideDown = normalizedRotation > 90 && normalizedRotation <= 270
      readableRotation = isUpsideDown
        ? (normalizedRotation + 180) % 360
        : normalizedRotation
      if (
        footprint.includes("pinrow") &&
        elm.text.includes("PIN") &&
        pinLabels
      ) {
        components.push(
          createPinrowSilkscreenText({ elm, pinLabels, readableRotation }),
        )
      } else if (elm.text === "{REF}") {
        components.push(
          new SilkscreenText({
            anchorAlignment: "center",
            text: componentName,
            fontSize: elm.font_size + 0.2,
            pcbX: isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x,
            pcbY: elm.anchor_position.y,
            pcbRotation: readableRotation ?? 0,
          }),
        )
      }
    }
  }
  return components
}
