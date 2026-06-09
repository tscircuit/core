import type { PinLabelsProp } from "@tscircuit/props"
import { getUnitVectorFromDirection } from "@tscircuit/math-utils"
import type { AnyCircuitElement, SchematicComponent } from "circuit-json"
import { CourtyardCircle } from "lib/components/primitive-components/CourtyardCircle"
import { CourtyardOutline } from "lib/components/primitive-components/CourtyardOutline"
import { CourtyardRect } from "lib/components/primitive-components/CourtyardRect"
import { CopperText } from "lib/components/primitive-components/CopperText"
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
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { PlatedHole } from "lib/components/primitive-components/PlatedHole"
import { SchematicArc } from "lib/components/primitive-components/SchematicArc"
import { SchematicCircle } from "lib/components/primitive-components/SchematicCircle"
import { SchematicLine } from "lib/components/primitive-components/SchematicLine"
import { SchematicPath } from "lib/components/primitive-components/SchematicPath"
import { SchematicRect } from "lib/components/primitive-components/SchematicRect"
import { SchematicText } from "lib/components/primitive-components/SchematicText"
import { SilkscreenCircle } from "lib/components/primitive-components/SilkscreenCircle"
import { SilkscreenLine } from "lib/components/primitive-components/SilkscreenLine"
import { SilkscreenPath } from "lib/components/primitive-components/SilkscreenPath"
import { SilkscreenRect } from "lib/components/primitive-components/SilkscreenRect"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import { Port } from "lib/components/primitive-components/Port/Port"
import { SymbolComponent } from "lib/components/primitive-components/Symbol"
import type { PrimitiveComponent } from "../components/base-components/PrimitiveComponent"
import { createPinrowSilkscreenText } from "./createPinrowSilkscreenText"

type SchematicPrimitiveWithStrokeWidth = Extract<
  AnyCircuitElement,
  { type: (typeof schematicPrimitiveTypesWithStrokeWidth)[number] }
>

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

const optional = <T>(value: T | null | undefined): T | undefined =>
  value ?? undefined

const getFacingDirectionFromSide = (side: string) => {
  switch (side) {
    case "left":
    case "right":
      return side
    case "top":
      return "up"
    case "bottom":
      return "down"
  }
  return null
}

const schematicPrimitiveTypesWithStrokeWidth = [
  "schematic_line",
  "schematic_rect",
  "schematic_circle",
  "schematic_arc",
  "schematic_path",
] as const

const isSchematicPrimitiveWithStrokeWidth = (
  elm: AnyCircuitElement,
): elm is SchematicPrimitiveWithStrokeWidth =>
  schematicPrimitiveTypesWithStrokeWidth.includes(
    elm.type as (typeof schematicPrimitiveTypesWithStrokeWidth)[number],
  )

const getSchematicSymbolId = (elm: AnyCircuitElement): string | undefined => {
  if (!("schematic_symbol_id" in elm)) return undefined
  return typeof elm.schematic_symbol_id === "string"
    ? elm.schematic_symbol_id
    : undefined
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
): PrimitiveComponent[] => {
  const components: PrimitiveComponent[] = []
  const schematicSymbolsByImportedId = new Map<string, SymbolComponent>()
  const schematicComponentsByImportedId = new Map<string, SchematicComponent>()
  const sourcePortsByImportedId = new Map<
    string,
    Extract<AnyCircuitElement, { type: "source_port" }>
  >()
  const schematicStrokeWidthBySymbolId = new Map<string, number>()

  for (const elm of circuitJson) {
    if (elm.type === "source_port") {
      sourcePortsByImportedId.set(elm.source_port_id, elm)
    }
  }

  for (const elm of circuitJson) {
    if (elm.type !== "schematic_symbol") continue

    const schematicSymbol = new SymbolComponent({
      name: elm.name,
    })
    schematicSymbolsByImportedId.set(elm.schematic_symbol_id, schematicSymbol)
    components.push(schematicSymbol)
  }

  for (const elm of circuitJson) {
    if (!isSchematicPrimitiveWithStrokeWidth(elm)) continue

    const schematicSymbolId = getSchematicSymbolId(elm)
    const strokeWidth = elm.stroke_width
    if (
      !schematicSymbolId ||
      typeof strokeWidth !== "number" ||
      !Number.isFinite(strokeWidth) ||
      schematicStrokeWidthBySymbolId.has(schematicSymbolId)
    ) {
      continue
    }

    schematicStrokeWidthBySymbolId.set(schematicSymbolId, strokeWidth)
  }

  for (const elm of circuitJson) {
    if (elm.type !== "schematic_component") continue
    schematicComponentsByImportedId.set(elm.schematic_component_id, elm)
  }

  const addSchematicPrimitive = (
    elm: AnyCircuitElement,
    primitive: PrimitiveComponent,
  ) => {
    const schematicSymbolId = getSchematicSymbolId(elm)
    const parentSymbol = schematicSymbolId
      ? schematicSymbolsByImportedId.get(schematicSymbolId)
      : undefined

    if (parentSymbol) {
      parentSymbol.add(primitive)
    } else {
      components.push(primitive)
    }
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
          portHints: elm.port_hints,
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
          portHints: elm.port_hints,
        }),
      )
    } else if (elm.type === "pcb_smtpad" && elm.shape === "pill") {
      components.push(
        new SmtPad({
          shape: "pill",
          height: elm.height,
          width: elm.width,
          radius: elm.radius,
          portHints: elm.port_hints,
          pcbX: elm.x,
          pcbY: elm.y,
          layer: elm.layer,
        }),
      )
    } else if (elm.type === "pcb_smtpad" && elm.shape === "polygon") {
      components.push(
        new SmtPad({
          shape: "polygon",
          points: elm.points,
          portHints: elm.port_hints,
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
    } else if (elm.type === "pcb_copper_text") {
      components.push(
        new CopperText({
          text: elm.text,
          pcbX: elm.anchor_position.x,
          pcbY: elm.anchor_position.y,
          pcbRotation: elm.ccw_rotation,
          anchorAlignment: elm.anchor_alignment,
          fontSize: elm.font_size,
          layer: elm.layer,
          mirrored: elm.is_mirrored,
          knockout: elm.is_knockout,
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
            portHints: elm.port_hints,
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
            rectBorderRadius: elm.rect_border_radius,
            portHints: elm.port_hints,
            holeOffsetX: elm.hole_offset_x,
            holeOffsetY: elm.hole_offset_y,
          }),
        )
      } else if (elm.shape === "rotated_pill_hole_with_rect_pad") {
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
            rectBorderRadius: elm.rect_border_radius,
            portHints: elm.port_hints,
            holeOffsetX: elm.hole_offset_x,
            holeOffsetY: elm.hole_offset_y,
            pcbRotation: elm.hole_ccw_rotation,
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
    } else if (elm.type === "pcb_hole" && elm.hole_shape === "oval") {
      components.push(
        new Hole({
          pcbX: elm.x,
          pcbY: elm.y,
          shape: "oval",
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
    } else if (elm.type === "pcb_via") {
      const layers = elm.layers ?? []
      const pcbVia = new PcbVia({
        pcbX: elm.x,
        pcbY: elm.y,
        holeDiameter: elm.hole_diameter,
        outerDiameter: elm.outer_diameter,
        fromLayer: elm.from_layer ?? layers[0],
        toLayer: elm.to_layer ?? layers[layers.length - 1],
        layers,
        netIsAssignable: elm.net_is_assignable,
        isTented: elm.is_tented,
      })
      pcbVia._importedPcbTraceId = elm.pcb_trace_id
      components.push(pcbVia)
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
    } else if (elm.type === "pcb_courtyard_rect") {
      components.push(
        new CourtyardRect({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          width: elm.width,
          height: elm.height,
          layer: elm.layer,
        }),
      )
    } else if (elm.type === "pcb_courtyard_circle") {
      components.push(
        new CourtyardCircle({
          pcbX: elm.center.x,
          pcbY: elm.center.y,
          radius: elm.radius,
          layer: elm.layer,
        }),
      )
    } else if (elm.type === "pcb_courtyard_outline") {
      components.push(
        new CourtyardOutline({
          outline: elm.outline,
          layer: elm.layer,
        }),
      )
    } else if (elm.type === "schematic_line") {
      addSchematicPrimitive(
        elm,
        new SchematicLine({
          x1: elm.x1,
          y1: elm.y1,
          x2: elm.x2,
          y2: elm.y2,
          strokeWidth: optional(elm.stroke_width),
          color: elm.color,
          isDashed: elm.is_dashed,
        }),
      )
    } else if (elm.type === "schematic_rect") {
      addSchematicPrimitive(
        elm,
        new SchematicRect({
          schX: elm.center.x,
          schY: elm.center.y,
          width: elm.width,
          height: elm.height,
          rotation: elm.rotation,
          strokeWidth: optional(elm.stroke_width),
          color: elm.color,
          isFilled: elm.is_filled,
          fillColor: elm.fill_color,
          isDashed: elm.is_dashed,
        }),
      )
    } else if (elm.type === "schematic_circle") {
      addSchematicPrimitive(
        elm,
        new SchematicCircle({
          center: elm.center,
          radius: elm.radius,
          strokeWidth: optional(elm.stroke_width),
          color: elm.color,
          isFilled: elm.is_filled,
          fillColor: elm.fill_color,
          isDashed: elm.is_dashed,
        }),
      )
    } else if (elm.type === "schematic_arc") {
      addSchematicPrimitive(
        elm,
        new SchematicArc({
          center: elm.center,
          radius: elm.radius,
          startAngleDegrees: elm.start_angle_degrees,
          endAngleDegrees: elm.end_angle_degrees,
          direction: elm.direction,
          strokeWidth: optional(elm.stroke_width),
          color: elm.color,
          isDashed: elm.is_dashed,
        }),
      )
    } else if (elm.type === "schematic_text") {
      addSchematicPrimitive(
        elm,
        new SchematicText({
          schX: elm.position.x,
          schY: elm.position.y,
          text: elm.text,
          fontSize: elm.font_size,
          anchor: elm.anchor,
          color: elm.color,
          schRotation: elm.rotation,
        }),
      )
    } else if (elm.type === "schematic_path") {
      addSchematicPrimitive(
        elm,
        new SchematicPath({
          points: elm.points,
          strokeWidth: optional(elm.stroke_width),
          strokeColor: elm.stroke_color,
          dashLength: elm.dash_length,
          dashGap: elm.dash_gap,
          isFilled: elm.is_filled,
          fillColor: elm.fill_color,
        }),
      )
    } else if (elm.type === "schematic_port") {
      const schematicComponentId = elm.schematic_component_id
      if (typeof schematicComponentId !== "string") continue

      const schematicComponent =
        schematicComponentsByImportedId.get(schematicComponentId)
      const schematicSymbolId = schematicComponent?.schematic_symbol_id
      const parentSymbol =
        typeof schematicSymbolId === "string"
          ? schematicSymbolsByImportedId.get(schematicSymbolId)
          : undefined

      if (
        parentSymbol &&
        schematicComponent?.is_box_with_pins === true &&
        elm.center &&
        elm.side_of_component
      ) {
        const distance = elm.distance_from_component_edge!
        const facingDirection = getFacingDirectionFromSide(
          elm.side_of_component,
        )
        if (!facingDirection) continue

        const directionVector = getUnitVectorFromDirection(facingDirection)
        const stemDirection = elm.facing_direction === facingDirection ? 1 : -1
        const portCenter = {
          x: elm.center.x + directionVector.x * distance * stemDirection,
          y: elm.center.y + directionVector.y * distance * stemDirection,
        }

        const sourcePort = sourcePortsByImportedId.get(elm.source_port_id)
        const aliases = Array.from(
          new Set(
            [
              elm.display_pin_label,
              sourcePort?.name,
              ...(sourcePort?.port_hints ?? []),
            ].filter(
              (alias): alias is string =>
                typeof alias === "string" && alias.length > 0,
            ),
          ),
        )

        const fallbackPortName = elm.pin_number
          ? `pin${elm.pin_number}`
          : elm.schematic_port_id
        const portName = aliases[0] ?? elm.source_port_id ?? fallbackPortName

        parentSymbol.add(
          new Port({
            pinNumber: elm.pin_number,
            name: portName,
            aliases,
            schX: elm.center.x,
            schY: elm.center.y,
            direction: facingDirection,
          }),
        )

        parentSymbol.add(
          new SchematicLine({
            x1: elm.center.x,
            y1: elm.center.y,
            x2: portCenter.x,
            y2: portCenter.y,
            strokeWidth:
              typeof schematicSymbolId === "string"
                ? optional(
                    schematicStrokeWidthBySymbolId.get(schematicSymbolId),
                  )
                : undefined,
            isDashed: false,
          }),
        )
      }
    }
  }
  return components
}
