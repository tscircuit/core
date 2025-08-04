import type { AnyCircuitElement } from "circuit-json"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { SilkscreenPath } from "lib/components/primitive-components/SilkscreenPath"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { PlatedHole } from "lib/components/primitive-components/PlatedHole"
import { Keepout } from "lib/components/primitive-components/Keepout"
import { Hole } from "lib/components/primitive-components/Hole"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import { Cutout } from "lib/components/primitive-components/Cutout"
import { createPinrowSilkscreenText } from "./createPinrowSilkscreenText"
import type { PinLabelsProp } from "@tscircuit/props"

const calculateCcwRotation = (
  componentRotationStr: string | undefined | null,
  elementCcwRotation: number | undefined | null,
): number => {
  const componentAngle = parseInt(componentRotationStr || "0", 10)
  const baseRotation = -componentAngle
  const totalRotation = baseRotation + (elementCcwRotation ?? 0)

  const normalizedRotation = ((totalRotation % 360) + 360) % 360

  return normalizedRotation
}

export const createComponentsFromCircuitJson = (
  {
    componentName,
    componentRotation,
    footprint,
    pinLabels,
    pcbPinLabels,
    showSilkscreenPinLabels = true,
  }: {
    componentName: string
    componentRotation: string
    footprint: string
    pinLabels: PinLabelsProp
    pcbPinLabels?: PinLabelsProp
    showSilkscreenPinLabels?: boolean
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
    } else if (elm.type === "pcb_plated_hole") {
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
      } else if (elm.shape === "circular_hole_with_rect_pad") {
        components.push(
          new PlatedHole({
            pcbX: elm.x,
            pcbY: elm.y,
            shape: "circular_hole_with_rect_pad",
            holeDiameter: elm.hole_diameter,
            rectPadHeight: elm.rect_pad_height,
            rectPadWidth: elm.rect_pad_width,
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
    } else if (elm.type === "pcb_cutout") {
      if (elm.shape === "rect") {
        components.push(
          new Cutout({
            pcbX: elm.center.x,
            pcbY: elm.center.y,
            shape: "rect",
            width: elm.width,
            height: elm.height,
          }),
        )
      } else if (elm.shape === "circle") {
        components.push(
          new Cutout({
            pcbX: elm.center.x,
            pcbY: elm.center.y,
            shape: "circle",
            radius: elm.radius,
          }),
        )
      } else if (elm.shape === "polygon") {
        components.push(
          new Cutout({
            shape: "polygon",
            points: elm.points,
          }),
        )
      }
    } else if (elm.type === "pcb_silkscreen_text") {
      const ccwRotation = calculateCcwRotation(
        componentRotation,
        elm.ccw_rotation,
      )

      if (footprint.includes("pinrow") && elm.text.includes("PIN")) {
        // Skip pin labels if showSilkscreenPinLabels is false
        if (showSilkscreenPinLabels === false) {
          continue
        }

        components.push(
          createPinrowSilkscreenText({
            elm,
            pinLabels: pcbPinLabels ?? pinLabels,
            layer: elm.layer,
            readableRotation: ccwRotation,
            anchorAlignment: elm.anchor_alignment,
          }),
        )
      } else {
        components.push(
          new SilkscreenText({
            anchorAlignment: elm.anchor_alignment || "center",
            text: componentName,
            fontSize: elm.font_size + 0.2,
            pcbX: Number.isNaN(elm.anchor_position.x)
              ? 0
              : elm.anchor_position.x,
            pcbY: elm.anchor_position.y,
            pcbRotation: ccwRotation ?? 0,
          }),
        )
      }
    } else if (elm.type === "pcb_trace") {
      components.push(
        new PcbTrace({
          route: elm.route,
        }),
      )
    }
  }
  return components
}
