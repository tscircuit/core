import { smtPadProps } from "@tscircuit/props"
import {
  distance,
  type PcbSmtPad,
  type PcbSmtPadCircle,
  type PcbSmtPadRect,
  type PcbSmtPadPolygon,
  type PcbSmtPadRotatedRect,
  type PcbSmtPadPill,
} from "circuit-json"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import {
  PrimitiveComponent,
  type BaseComponentConfig,
} from "../base-components/PrimitiveComponent"
import type { Port } from "./Port"

export class SmtPad extends PrimitiveComponent<typeof smtPadProps> {
  pcb_smtpad_id: string | null = null

  matchedPort: Port | null = null

  isPcbPrimitive = true

  get config(): BaseComponentConfig {
    return {
      componentName: "SmtPad",
      zodProps: smtPadProps,
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "circle") {
      return { width: props.radius! * 2, height: props.radius! * 2 }
    }
    if (props.shape === "rect") {
      return { width: props.width!, height: props.height! }
    }
    if (props.shape === "rotated_rect") {
      const rotationDegrees = props.ccwRotation ?? 0
      const angleRad = (rotationDegrees * Math.PI) / 180
      const cosAngle = Math.cos(angleRad)
      const sinAngle = Math.sin(angleRad)
      const width =
        Math.abs(props.width! * cosAngle) + Math.abs(props.height! * sinAngle)
      const height =
        Math.abs(props.width! * sinAngle) + Math.abs(props.height! * cosAngle)
      return { width, height }
    }
    if (props.shape === "polygon") {
      const points = props.points!
      const xs = points.map((p) => p.x)
      const ys = points.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      return { width: maxX - minX, height: maxY - minY }
    }
    if (props.shape === "pill") {
      return { width: props.width!, height: props.height! }
    }
    throw new Error(
      `getPcbSize for shape "${(props as any).shape}" not implemented for ${this.componentName}`,
    )
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
    const isCoveredWithSolderMask = props.coveredWithSolderMask ?? false
    const shouldCreateSolderPaste = !isCoveredWithSolderMask
    const soldermaskMargin = props.solderMaskMargin

    this.emitSolderMaskMarginWarning(isCoveredWithSolderMask, soldermaskMargin)

    const subcircuit = this.getSubcircuit()

    const position = this._getGlobalPcbPositionBeforeLayout()
    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const decomposedTransform = decomposeTSR(
      this._computePcbGlobalTransformBeforeLayout(),
    )
    const rotationDegrees = (decomposedTransform.rotation.angle * 180) / Math.PI
    const normalizedRotationDegrees = ((rotationDegrees % 360) + 360) % 360
    const rotationTolerance = 0.01
    const isAxisAligned =
      Math.abs(normalizedRotationDegrees) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 180) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 360) < rotationTolerance
    const isRotated90Degrees =
      Math.abs(normalizedRotationDegrees - 90) < rotationTolerance ||
      Math.abs(normalizedRotationDegrees - 270) < rotationTolerance
    let finalRotationDegrees =
      Math.abs(normalizedRotationDegrees - 360) < rotationTolerance
        ? 0
        : normalizedRotationDegrees
    const transformRotationBeforeFlip = finalRotationDegrees
    const { maybeFlipLayer, isFlipped } = this._getPcbPrimitiveFlippedHelpers()

    if (isFlipped) {
      finalRotationDegrees = (360 - finalRotationDegrees + 360) % 360
    }

    const portHints = props.portHints?.map((ph) => ph.toString()) ?? []

    let pcb_smtpad: PcbSmtPad | null = null
    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!
    if (props.shape === "circle") {
      pcb_smtpad = db.pcb_smtpad.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!, // port likely isn't matched
        layer: maybeFlipLayer(props.layer ?? "top"),
        shape: "circle",
        radius: props.radius!,
        port_hints: portHints,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        soldermask_margin: soldermaskMargin,
        solver_mask: (props as any).solverMask,
        x: position.x,
        y: position.y,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      } as PcbSmtPadCircle) as PcbSmtPadCircle
      if (shouldCreateSolderPaste)
        db.pcb_solder_paste.insert({
          layer: pcb_smtpad.layer,
          shape: "circle",
          radius: pcb_smtpad.radius * 0.7,
          x: pcb_smtpad.x,
          y: pcb_smtpad.y,
          pcb_component_id: pcb_smtpad.pcb_component_id,
          pcb_smtpad_id: pcb_smtpad.pcb_smtpad_id,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        } as PcbSmtPadCircle)
    } else if (props.shape === "rect") {
      const hasRotation = !isAxisAligned && !isRotated90Degrees
      if (hasRotation) {
        pcb_smtpad = db.pcb_smtpad.insert({
          pcb_component_id,
          pcb_port_id: this.matchedPort?.pcb_port_id!,
          layer: maybeFlipLayer(props.layer ?? "top"),
          shape: "rotated_rect",
          width: props.width!,
          height: props.height!,
          corner_radius: props.cornerRadius ?? undefined,
          x: position.x,
          y: position.y,
          ccw_rotation: finalRotationDegrees,
          port_hints: portHints,
          is_covered_with_solder_mask: isCoveredWithSolderMask,
          soldermask_margin: soldermaskMargin,
          solver_mask: (props as any).solverMask,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        } as PcbSmtPadRotatedRect) as PcbSmtPadRotatedRect
      } else {
        pcb_smtpad = db.pcb_smtpad.insert({
          pcb_component_id,
          pcb_port_id: this.matchedPort?.pcb_port_id!,
          layer: maybeFlipLayer(props.layer ?? "top"),
          shape: "rect",
          width: isRotated90Degrees ? props.height! : props.width!,
          height: isRotated90Degrees ? props.width! : props.height!,
          corner_radius: props.cornerRadius ?? undefined,
          port_hints: portHints,
          is_covered_with_solder_mask: isCoveredWithSolderMask,
          soldermask_margin: soldermaskMargin,
          solver_mask: (props as any).solverMask,
          x: position.x,
          y: position.y,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        } as PcbSmtPadRect) as PcbSmtPadRect
      }
      if (shouldCreateSolderPaste) {
        if (pcb_smtpad.shape === "rect") {
          db.pcb_solder_paste.insert({
            layer: maybeFlipLayer(props.layer ?? "top"),
            shape: "rect",
            width: pcb_smtpad.width * 0.7,
            height: pcb_smtpad.height * 0.7,
            x: pcb_smtpad.x,
            y: pcb_smtpad.y,
            pcb_component_id: pcb_smtpad.pcb_component_id,
            pcb_smtpad_id: pcb_smtpad.pcb_smtpad_id,
            subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
            pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
          } as PcbSmtPadRect)
        } else if (pcb_smtpad.shape === "rotated_rect") {
          db.pcb_solder_paste.insert({
            layer: maybeFlipLayer(props.layer ?? "top"),
            shape: "rotated_rect",
            width: pcb_smtpad.width * 0.7,
            height: pcb_smtpad.height * 0.7,
            x: pcb_smtpad.x,
            y: pcb_smtpad.y,
            ccw_rotation: pcb_smtpad.ccw_rotation,
            pcb_component_id: pcb_smtpad.pcb_component_id,
            pcb_smtpad_id: pcb_smtpad.pcb_smtpad_id,
            subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
            pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
          } as PcbSmtPadRotatedRect)
        }
      }
    } else if (props.shape === "rotated_rect") {
      const baseRotation = props.ccwRotation ?? 0
      const combinedRotationBeforeFlip =
        (transformRotationBeforeFlip + baseRotation + 360) % 360
      const padRotation = isFlipped
        ? (360 - combinedRotationBeforeFlip + 360) % 360
        : combinedRotationBeforeFlip

      pcb_smtpad = db.pcb_smtpad.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!,
        layer: maybeFlipLayer(props.layer ?? "top"),
        shape: "rotated_rect",
        width: props.width!,
        height: props.height!,
        corner_radius: props.cornerRadius ?? undefined,
        x: position.x,
        y: position.y,
        ccw_rotation: padRotation,
        port_hints: portHints,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        soldermask_margin: soldermaskMargin,
        solver_mask: (props as any).solverMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      } as PcbSmtPadRotatedRect) as PcbSmtPadRotatedRect

      if (shouldCreateSolderPaste)
        db.pcb_solder_paste.insert({
          layer: maybeFlipLayer(props.layer ?? "top"),
          shape: "rotated_rect",
          width: pcb_smtpad.width * 0.7,
          height: pcb_smtpad.height * 0.7,
          x: position.x,
          y: position.y,
          ccw_rotation: padRotation,
          pcb_component_id,
          pcb_smtpad_id: pcb_smtpad.pcb_smtpad_id,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
        } as PcbSmtPadRotatedRect)
    } else if (props.shape === "polygon") {
      const transformedPoints = props.points.map((point) => {
        const transformed = applyToPoint(globalTransform, {
          x: distance.parse(point.x),
          y: distance.parse(point.y),
        })
        return {
          x: transformed.x,
          y: transformed.y,
        }
      })

      pcb_smtpad = db.pcb_smtpad.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!, // port likely isn't matched
        layer: maybeFlipLayer(props.layer ?? "top"),
        shape: "polygon",
        points: transformedPoints,
        port_hints: portHints,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        soldermask_margin: soldermaskMargin,
        solver_mask: (props as any).solverMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      } as PcbSmtPadPolygon) as PcbSmtPadPolygon
    } else if (props.shape === "pill") {
      pcb_smtpad = db.pcb_smtpad.insert({
        pcb_component_id,
        pcb_port_id: this.matchedPort?.pcb_port_id!, // port likely isn't matched
        layer: maybeFlipLayer(props.layer ?? "top"),
        shape: "pill",
        x: position.x,
        y: position.y,
        radius: props.radius!,
        height: props.height!,
        width: props.width!,
        port_hints: portHints,
        is_covered_with_solder_mask: isCoveredWithSolderMask,
        soldermask_margin: soldermaskMargin,
        solver_mask: (props as any).solverMask,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      } as PcbSmtPadPill) as PcbSmtPadPill
    }
    if (pcb_smtpad) {
      this.pcb_smtpad_id = pcb_smtpad.pcb_smtpad_id
    }
  }

  doInitialPcbPortAttachment(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    db.pcb_smtpad.update(this.pcb_smtpad_id!, {
      pcb_port_id: this.matchedPort?.pcb_port_id!,
    })
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    const { db } = this.root!
    const smtpad = db.pcb_smtpad.get(this.pcb_smtpad_id!)!

    if (smtpad.shape === "rect") {
      return {
        center: { x: smtpad.x, y: smtpad.y },
        bounds: {
          left: smtpad.x - smtpad.width / 2,
          top: smtpad.y + smtpad.height / 2,
          right: smtpad.x + smtpad.width / 2,
          bottom: smtpad.y - smtpad.height / 2,
        },
        width: smtpad.width,
        height: smtpad.height,
      }
    }
    if (smtpad.shape === "rotated_rect") {
      const angleRad = (smtpad.ccw_rotation * Math.PI) / 180
      const cosAngle = Math.cos(angleRad)
      const sinAngle = Math.sin(angleRad)

      const w2 = smtpad.width / 2
      const h2 = smtpad.height / 2

      const xExtent = Math.abs(w2 * cosAngle) + Math.abs(h2 * sinAngle)
      const yExtent = Math.abs(w2 * sinAngle) + Math.abs(h2 * cosAngle)

      return {
        center: { x: smtpad.x, y: smtpad.y },
        bounds: {
          left: smtpad.x - xExtent,
          right: smtpad.x + xExtent,
          top: smtpad.y - yExtent,
          bottom: smtpad.y + yExtent,
        },
        width: xExtent * 2,
        height: yExtent * 2,
      }
    }
    if (smtpad.shape === "circle") {
      return {
        center: { x: smtpad.x, y: smtpad.y },
        bounds: {
          left: smtpad.x - smtpad.radius,
          top: smtpad.y - smtpad.radius,
          right: smtpad.x + smtpad.radius,
          bottom: smtpad.y + smtpad.radius,
        },
        width: smtpad.radius * 2,
        height: smtpad.radius * 2,
      }
    }
    if (smtpad.shape === "polygon") {
      const points = smtpad.points!
      const xs = points.map((p) => p.x)
      const ys = points.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      return {
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        bounds: {
          left: minX,
          top: maxY,
          right: maxX,
          bottom: minY,
        },
        width: maxX - minX,
        height: maxY - minY,
      }
    }
    if (smtpad.shape === "pill") {
      // For pill shape, the radius is applied to the shorter dimension
      const halfWidth = smtpad.width / 2
      const halfHeight = smtpad.height / 2
      return {
        center: { x: smtpad.x, y: smtpad.y },
        bounds: {
          left: smtpad.x - halfWidth,
          top: smtpad.y - halfHeight,
          right: smtpad.x + halfWidth,
          bottom: smtpad.y + halfHeight,
        },
        width: smtpad.width,
        height: smtpad.height,
      }
    }
    throw new Error(
      `circuitJson bounds calculation not implemented for shape "${(smtpad as any).shape}"`,
    )
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    db.pcb_smtpad.update(this.pcb_smtpad_id!, {
      x: newCenter.x,
      y: newCenter.y,
    })

    const solderPaste = db.pcb_solder_paste
      .list()
      .find((elm) => elm.pcb_smtpad_id === this.pcb_smtpad_id)
    if (solderPaste) {
      db.pcb_solder_paste.update(solderPaste.pcb_solder_paste_id, {
        x: newCenter.x,
        y: newCenter.y,
      })
    }

    this.matchedPort?._setPositionFromLayout(newCenter)
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_smtpad_id) return

    const pad = db.pcb_smtpad.get(this.pcb_smtpad_id)!

    if (
      pad.shape === "rect" ||
      pad.shape === "circle" ||
      pad.shape === "rotated_rect" ||
      pad.shape === "pill"
    ) {
      this._setPositionFromLayout({ x: pad.x + deltaX, y: pad.y + deltaY })
    } else if (pad.shape === "polygon") {
      db.pcb_smtpad.update(this.pcb_smtpad_id, {
        points: pad.points.map((p) => ({
          x: p.x + deltaX,
          y: p.y + deltaY,
        })),
      })

      const newCenter = {
        x: this._getPcbCircuitJsonBounds().center.x + deltaX / 2,
        y: this._getPcbCircuitJsonBounds().center.y + deltaY / 2,
      }
      this.matchedPort?._setPositionFromLayout(newCenter)
    }
  }
}
