import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { platedHoleProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import type { Port } from "./Port"
import type {
  PCBPlatedHoleInput,
  PcbPlatedHoleOval,
  PcbHoleCircularWithRectPad,
  PcbHolePillWithRectPad,
  PcbHoleRotatedPillWithRectPad,
  PcbHoleWithPolygonPad,
} from "circuit-json"

export class PlatedHole extends PrimitiveComponent<typeof platedHoleProps> {
  pcb_plated_hole_id: string | null = null
  matchedPort: Port | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "PlatedHole",
      zodProps: platedHoleProps,
    }
  }

  getAvailablePcbLayers(): string[] {
    // TODO use project layerCount
    return ["top", "inner1", "inner2", "bottom"]
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.outerDiameter, height: props.outerDiameter }
    }
    if (props.shape === "oval" || props.shape === "pill") {
      return { width: props.outerWidth, height: props.outerHeight }
    }
    if (props.shape === "circular_hole_with_rect_pad") {
      return { width: props.rectPadWidth, height: props.rectPadHeight }
    }
    if (props.shape === "pill_hole_with_rect_pad") {
      return { width: props.rectPadWidth, height: props.rectPadHeight }
    }
    if (props.shape === "hole_with_polygon_pad") {
      // Calculate bounding box from pad outline
      if (!props.padOutline || props.padOutline.length === 0) {
        throw new Error(
          "padOutline is required for hole_with_polygon_pad shape",
        )
      }
      const xs = props.padOutline.map((p) =>
        typeof p.x === "number" ? p.x : parseFloat(String(p.x)),
      )
      const ys = props.padOutline.map((p) =>
        typeof p.y === "number" ? p.y : parseFloat(String(p.y)),
      )
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      return { width: maxX - minX, height: maxY - minY }
    }
    throw new Error(
      `getPcbSize for shape "${(props as any).shape}" not implemented for ${this.componentName}`,
    )
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const platedHole = db.pcb_plated_hole.get(this.pcb_plated_hole_id!)!
    const size = this.getPcbSize()

    return {
      center: { x: platedHole.x, y: platedHole.y },
      bounds: {
        left: platedHole.x - size.width / 2,
        top: platedHole.y + size.height / 2,
        right: platedHole.x + size.width / 2,
        bottom: platedHole.y - size.height / 2,
      },
      width: size.width,
      height: size.height,
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_plated_hole.update(this.pcb_plated_hole_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })
    this.matchedPort?._setPositionFromLayout(newCenter)
  }

  doInitialPortMatching(): void {
    const parentPorts = this.getPrimitiveContainer()?.selectAll(
      "port",
    ) as Port[]

    if (!this.props.portHints) {
      return
    }

    for (const port of parentPorts) {
      if (port.isMatchingAnyOf(this.props.portHints)) {
        this.matchedPort = port
        port.registerMatch(this)
        return
      }
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    const subcircuit = this.getSubcircuit()
    const soldermaskMargin = props.solderMaskMargin
    const isCoveredWithSolderMask = props.coveredWithSolderMask ?? false

    this.emitSolderMaskMarginWarning(isCoveredWithSolderMask, soldermaskMargin)

    if (props.shape === "circle") {
      const pcb_plated_hole = db.pcb_plated_hole.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        // @ts-ignore - some issue with circuit-json union type
        outer_diameter: props.outerDiameter,
        hole_diameter: props.holeDiameter,
        shape: "circle" as const,
        port_hints: this.getNameAndAliases(),
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })

      this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id
      db.pcb_solder_paste.insert({
        layer: "top",
        shape: "circle",
        // @ts-ignore: no idea why this is triggering
        radius: props.outerDiameter / 2,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })
      db.pcb_solder_paste.insert({
        layer: "bottom",
        shape: "circle",
        // @ts-ignore: no idea why this is triggering
        radius: props.outerDiameter / 2,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })
    } else if (props.shape === "pill" && props.rectPad) {
      const pcb_plated_hole = db.pcb_plated_hole.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        outer_width: props.outerWidth,
        outer_height: props.outerHeight,
        hole_width: props.holeWidth,
        hole_height: props.holeHeight,
        shape: "rotated_pill_hole_with_rect_pad",
        type: "pcb_plated_hole",
        port_hints: this.getNameAndAliases(),
        pcb_plated_hole_id: this.pcb_plated_hole_id,
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        hole_shape: "rotated_pill",
        pad_shape: "rect",
        hole_ccw_rotation: props.pcbRotation ?? 0,
        rect_ccw_rotation: props.pcbRotation ?? 0,
        rect_pad_width: props.outerWidth,
        rect_pad_height: props.outerHeight,
        hole_offset_x: props.holeOffsetX,
        hole_offset_y: props.holeOffsetY,
      } as PcbHoleRotatedPillWithRectPad)

      this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id

      // TODO: add solder paste
    } else if (props.shape === "pill" || props.shape === "oval") {
      const pcb_plated_hole = db.pcb_plated_hole.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        outer_width: props.outerWidth,
        outer_height: props.outerHeight,
        hole_width: props.holeWidth,
        hole_height: props.holeHeight,
        shape: props.shape,
        port_hints: this.getNameAndAliases(),
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        ccw_rotation: props.pcbRotation ?? 0,
        // NOTE: currently PcbPlatedHoleOval erroneously includes both the shape "pill" and "oval"
      } as PcbPlatedHoleOval)

      this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id
      db.pcb_solder_paste.insert({
        layer: "top",
        shape: props.shape,
        // @ts-ignore: no idea why this is triggering
        width: props.outerWidth,
        height: props.outerHeight,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })
      db.pcb_solder_paste.insert({
        layer: "bottom",
        shape: props.shape,
        // @ts-ignore: no idea why this is triggering
        width: props.outerWidth,
        height: props.outerHeight,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })
    } else if (props.shape === "circular_hole_with_rect_pad") {
      const pcb_plated_hole = db.pcb_plated_hole.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        hole_diameter: props.holeDiameter,
        rect_pad_width: props.rectPadWidth,
        rect_pad_height: props.rectPadHeight,
        shape: "circular_hole_with_rect_pad" as const,
        port_hints: this.getNameAndAliases(),
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        hole_offset_x: props.holeOffsetX,
        hole_offset_y: props.holeOffsetY,
        rect_border_radius: props.rectBorderRadius ?? 0,
        rect_ccw_rotation: props.pcbRotation ?? 0,
      } as PcbHoleCircularWithRectPad)
      this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id
    } else if (props.shape === "pill_hole_with_rect_pad") {
      const pcb_plated_hole = db.pcb_plated_hole.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        hole_width: props.holeWidth,
        hole_height: props.holeHeight,
        rect_pad_width: props.rectPadWidth,
        rect_pad_height: props.rectPadHeight,
        hole_offset_x: props.holeOffsetX,
        hole_offset_y: props.holeOffsetY,
        shape: "pill_hole_with_rect_pad" as const,
        port_hints: this.getNameAndAliases(),
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      } as PcbHolePillWithRectPad)
      this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id
    } else if (props.shape === "hole_with_polygon_pad") {
      // Pad outline points are relative to the hole position (x, y)
      const padOutline = (props.padOutline || []).map((point) => {
        const x =
          typeof point.x === "number" ? point.x : parseFloat(String(point.x))
        const y =
          typeof point.y === "number" ? point.y : parseFloat(String(point.y))
        return {
          x,
          y,
        }
      })

      const pcb_plated_hole = db.pcb_plated_hole.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        shape: "hole_with_polygon_pad" as const,
        hole_shape: props.holeShape || "circle",
        hole_diameter: props.holeDiameter,
        hole_width: props.holeWidth,
        hole_height: props.holeHeight,
        pad_outline: padOutline,
        hole_offset_x:
          typeof props.holeOffsetX === "number"
            ? props.holeOffsetX
            : parseFloat(String(props.holeOffsetX || 0)),
        hole_offset_y:
          typeof props.holeOffsetY === "number"
            ? props.holeOffsetY
            : parseFloat(String(props.holeOffsetY || 0)),
        port_hints: this.getNameAndAliases(),
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        soldermask_margin: soldermaskMargin,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      } as PcbHoleWithPolygonPad)
      this.pcb_plated_hole_id = pcb_plated_hole.pcb_plated_hole_id
    }
  }

  doInitialPcbPortAttachment(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    db.pcb_plated_hole.update(this.pcb_plated_hole_id!, {
      pcb_port_id: this.matchedPort?.pcb_port_id!,
    })
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_plated_hole_id) return

    const hole = db.pcb_plated_hole.get(this.pcb_plated_hole_id)
    if (hole) {
      const newCenter = {
        x: hole.x + deltaX,
        y: hole.y + deltaY,
      }
      this._setPositionFromLayout(newCenter)
    }
  }
}
