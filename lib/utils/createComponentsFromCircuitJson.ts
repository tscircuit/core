import type { PinLabelsProp } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { Cutout } from "lib/components/primitive-components/Cutout"
import { FabricationNotePath } from "lib/components/primitive-components/FabricationNotePath"
import { FabricationNoteRect } from "lib/components/primitive-components/FabricationNoteRect"
import { FabricationNoteText } from "lib/components/primitive-components/FabricationNoteText"
import { Hole } from "lib/components/primitive-components/Hole"
import { Keepout } from "lib/components/primitive-components/Keepout"
import { PcbNoteLine } from "lib/components/primitive-components/PcbNoteLine"
import { PcbNotePath } from "lib/components/primitive-components/PcbNotePath"
import { PcbNoteRect } from "lib/components/primitive-components/PcbNoteRect"
import { PcbNoteText } from "lib/components/primitive-components/PcbNoteText"
import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import { PlatedHole } from "lib/components/primitive-components/PlatedHole"
import { SilkscreenCircle } from "lib/components/primitive-components/SilkscreenCircle"
import { SilkscreenLine } from "lib/components/primitive-components/SilkscreenLine"
import { SilkscreenPath } from "lib/components/primitive-components/SilkscreenPath"
import { SilkscreenRect } from "lib/components/primitive-components/SilkscreenRect"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { createPinrowSilkscreenText } from "./createPinrowSilkscreenText"

const calculateCcwRotation = (
  componentRotationStr: string | undefined | null,
  elementCcwRotation: number | undefined | null,
): number => {
  const componentAngle = parseInt(componentRotationStr || "0", 10)
  let totalRotation: number
  if (elementCcwRotation !== undefined && elementCcwRotation !== null) {
    totalRotation = elementCcwRotation - componentAngle
  } else {
    totalRotation = componentAngle
  }

  const normalizedRotation = ((totalRotation % 360) + 360) % 360

  return normalizedRotation
}

export interface CreateComponentsResult {
  components: PrimitiveComponent[]
  internallyConnectedGroups: string[][]
}

export const createComponentsFromCircuitJson = (
  {
    componentName,
    componentRotation,
    footprinterString,
    pinLabels,
    pcbPinLabels,
  }: {
    componentName: string
    componentRotation: string
    footprinterString?: string
    pinLabels?: PinLabelsProp
    pcbPinLabels?: PinLabelsProp
  },
  circuitJson: AnyCircuitElement[],
): CreateComponentsResult => {
  const components: PrimitiveComponent[] = []

  // Detect duplicate port hints across pads so each pad gets a unique port.
  // Only deduplicate non-numeric named hints (e.g. "SH"), not numeric pin
  // numbers (e.g. "0", "1") which legitimately share the same port.
  const pinNumberPattern = /^(pin)?\d+$/
  const portHintCounts = new Map<string, number>()
  for (const elm of circuitJson) {
    if (
      (elm.type === "pcb_smtpad" || elm.type === "pcb_plated_hole") &&
      elm.port_hints
    ) {
      // Skip pads with empty/blank port hints — they don't map to real ports
      const hasNonEmptyHint = elm.port_hints.some((h) => h.trim() !== "")
      if (!hasNonEmptyHint) continue
      // Skip pads whose hints are all numeric pin numbers — those legitimately
      // share a port and should not be deduplicated
      const allNumeric = elm.port_hints.every(
        (h) => h.trim() === "" || pinNumberPattern.test(h),
      )
      if (allNumeric) continue
      const key = elm.port_hints.join(",")
      portHintCounts.set(key, (portHintCounts.get(key) ?? 0) + 1)
    }
  }

  const portHintOccurrence = new Map<string, number>()
  const internallyConnectedGroups: string[][] = []
  for (const [key, count] of portHintCounts) {
    if (count > 1) {
      const originalHints = key.split(",")
      const group: string[] = []
      for (let i = 0; i < count; i++) {
        const suffix = i === 0 ? "" : `_${i + 1}`
        group.push(...originalHints.map((h) => `${h}${suffix}`))
      }
      internallyConnectedGroups.push(group)
    }
  }

  const resolvePortHints = (
    portHints: string[] | undefined,
  ): string[] | undefined => {
    if (!portHints) return portHints
    const key = portHints.join(",")
    const count = portHintCounts.get(key) ?? 0
    if (count <= 1) return portHints
    const occ = (portHintOccurrence.get(key) ?? 0) + 1
    portHintOccurrence.set(key, occ)
    if (occ === 1) return portHints // first occurrence keeps original
    const suffix = `_${occ}`
    return portHints.map((h) => `${h}${suffix}`)
  }

  for (const elm of circuitJson) {
    if (elm.type === "pcb_smtpad" && elm.shape === "rect") {
      components.push(
        new SmtPad({
          pcbX: elm.x,
          pcbY: elm.y,
          layer: elm.layer,
          shape: "rect",
          height: elm.height,
          width: elm.width,
          portHints: resolvePortHints(elm.port_hints),
          rectBorderRadius: elm.rect_border_radius,
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
          portHints: resolvePortHints(elm.port_hints),
        }),
      )
    } else if (elm.type === "pcb_smtpad" && elm.shape === "pill") {
      components.push(
        new SmtPad({
          shape: "pill",
          height: elm.height,
          width: elm.width,
          radius: elm.radius,
          portHints: resolvePortHints(elm.port_hints),
          pcbX: elm.x,
          pcbY: elm.y,
          layer: elm.layer,
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
            portHints: resolvePortHints(elm.port_hints),
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
            portHints: resolvePortHints(elm.port_hints),
            rectBorderRadius: elm.rect_border_radius,
            holeOffsetX: elm.hole_offset_x,
            holeOffsetY: elm.hole_offset_y,
          }),
        )
      } else if (elm.shape === "pill" || elm.shape === "oval") {
        components.push(
          new PlatedHole({
            pcbX: elm.x,
            pcbY: elm.y,
            shape: elm.shape,
            holeWidth: elm.hole_width,
            holeHeight: elm.hole_height,
            outerWidth: elm.outer_width,
            outerHeight: elm.outer_height,
            portHints: resolvePortHints(elm.port_hints),
          }),
        )
      } else if (elm.shape === "pill_hole_with_rect_pad") {
        components.push(
          new PlatedHole({
            pcbX: elm.x,
            pcbY: elm.y,
            shape: "pill_hole_with_rect_pad",
            holeShape: "pill",
            padShape: "rect",
            holeWidth: elm.hole_width,
            holeHeight: elm.hole_height,
            rectPadWidth: elm.rect_pad_width,
            rectPadHeight: elm.rect_pad_height,
            portHints: resolvePortHints(elm.port_hints),
            holeOffsetX: elm.hole_offset_x,
            holeOffsetY: elm.hole_offset_y,
          }),
        )
      } else if (elm.shape === "hole_with_polygon_pad") {
        components.push(
          new PlatedHole({
            pcbX: elm.x,
            pcbY: elm.y,
            shape: "hole_with_polygon_pad",
            holeShape: elm.hole_shape || "circle",
            holeDiameter: elm.hole_diameter,
            holeWidth: elm.hole_width,
            holeHeight: elm.hole_height,
            padOutline: elm.pad_outline || [],
            holeOffsetX: elm.hole_offset_x,
            holeOffsetY: elm.hole_offset_y,
            portHints: resolvePortHints(elm.port_hints),
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
    } else if (elm.type === "pcb_hole" && elm.hole_shape === "rect") {
      components.push(
        new Hole({
          pcbX: elm.x,
          pcbY: elm.y,
          shape: "rect",
          width: elm.hole_width,
          height: elm.hole_height,
        }),
      )
    } else if (elm.type === "pcb_hole" && elm.hole_shape === "pill") {
      components.push(
        new Hole({
          pcbX: elm.x,
          pcbY: elm.y,
          shape: "pill",
          width: elm.hole_width,
          height: elm.hole_height,
        }),
      )
    } else if (elm.type === "pcb_hole" && elm.hole_shape === "rotated_pill") {
      components.push(
        new Hole({
          pcbX: elm.x,
          pcbY: elm.y,
          shape: "pill",
          width: elm.hole_width,
          height: elm.hole_height,
          pcbRotation: elm.ccw_rotation,
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
      if (footprinterString?.includes("pinrow") && elm.text.includes("PIN")) {
        components.push(
          createPinrowSilkscreenText({
            elm,
            pinLabels: pcbPinLabels ?? pinLabels ?? {},
            layer: elm.layer,
            readableRotation: ccwRotation,
            anchorAlignment: elm.anchor_alignment,
          }),
        )
      } else {
        const silkscreenText = new SilkscreenText({
          anchorAlignment: elm.anchor_alignment || "center",
          text: componentName || elm.text,
          pcbX: Number.isNaN(elm.anchor_position.x) ? 0 : elm.anchor_position.x,
          pcbY: elm.anchor_position.y,
          pcbRotation: ccwRotation ?? 0,
        })
        silkscreenText._footprinterFontSize = elm.font_size + 0.2
        components.push(silkscreenText)
      }
    } else if (elm.type === "pcb_trace") {
      components.push(
        new PcbTrace({
          route: elm.route,
        }),
      )
    } else if (elm.type === "pcb_silkscreen_rect") {
      components.push(
        new SilkscreenRect({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          width: elm.width,
          height: elm.height,
          layer: elm.layer,
          strokeWidth: elm.stroke_width,
          filled: elm.is_filled,
          cornerRadius: elm.corner_radius,
        }),
      )
    } else if (elm.type === "pcb_silkscreen_circle") {
      components.push(
        new SilkscreenCircle({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          radius: elm.radius,
          layer: elm.layer,
          strokeWidth: elm.stroke_width,
        }),
      )
    } else if (elm.type === "pcb_silkscreen_line") {
      components.push(
        new SilkscreenLine({
          x1: elm.x1,
          y1: elm.y1,
          x2: elm.x2,
          y2: elm.y2,
          layer: elm.layer,
          strokeWidth: elm.stroke_width,
        }),
      )
    } else if (elm.type === "pcb_fabrication_note_text") {
      components.push(
        new FabricationNoteText({
          pcbX: elm.anchor_position.x,
          pcbY: elm.anchor_position.y,
          text: elm.text,
          fontSize: elm.font_size,
          anchorAlignment: elm.anchor_alignment,
          color: elm.color,
          font: elm.font,
        }),
      )
    } else if (elm.type === "pcb_fabrication_note_path") {
      components.push(
        new FabricationNotePath({
          route: elm.route,
          strokeWidth: elm.stroke_width,
          color: elm.color,
          layer: elm.layer,
        }),
      )
    } else if (elm.type === "pcb_fabrication_note_rect") {
      components.push(
        new FabricationNoteRect({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          width: elm.width,
          height: elm.height,
          strokeWidth: elm.stroke_width,
          isFilled: elm.is_filled,
          color: elm.color,
          layer: elm.layer,
          cornerRadius: elm.corner_radius,
          hasStroke: elm.has_stroke,
          isStrokeDashed: elm.is_stroke_dashed,
        }),
      )
    } else if (elm.type === "pcb_note_text") {
      components.push(
        new PcbNoteText({
          pcbX: elm.anchor_position.x,
          pcbY: elm.anchor_position.y,
          text: elm.text ?? "",
          fontSize: elm.font_size,
          anchorAlignment: elm.anchor_alignment,
          color: elm.color,
          font: elm.font,
        }),
      )
    } else if (elm.type === "pcb_note_rect") {
      components.push(
        new PcbNoteRect({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          width: elm.width,
          height: elm.height,
          strokeWidth: elm.stroke_width,
          isFilled: elm.is_filled,
          color: elm.color,
          cornerRadius: elm.corner_radius,
          hasStroke: elm.has_stroke,
          isStrokeDashed: elm.is_stroke_dashed,
        }),
      )
    } else if (elm.type === "pcb_note_path") {
      components.push(
        new PcbNotePath({
          route: elm.route,
          strokeWidth: elm.stroke_width,
          color: elm.color,
        }),
      )
    } else if (elm.type === "pcb_note_line") {
      components.push(
        new PcbNoteLine({
          x1: elm.x1,
          y1: elm.y1,
          x2: elm.x2,
          y2: elm.y2,
          strokeWidth: elm.stroke_width,
          color: elm.color,
          isDashed: elm.is_dashed,
        }),
      )
    }
  }
  return { components, internallyConnectedGroups }
}
