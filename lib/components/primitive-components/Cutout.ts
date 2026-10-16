import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import type {
  PcbCutoutRect,
  PcbCutoutCircle,
  PcbCutoutPolygon,
  PcbCutoutPath,
} from "circuit-json"
import { cutoutProps } from "@tscircuit/props"

export class Cutout extends PrimitiveComponent<typeof cutoutProps> {
  pcb_cutout_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "Cutout",
      zodProps: cutoutProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const subcircuit = this.getSubcircuit()
    const pcb_group_id = this.getGroup()?.pcb_group_id ?? undefined

    const globalPosition = this._getGlobalPcbPositionBeforeLayout()

    const container = this.getPrimitiveContainer()
    const pcb_component_id =
      this.parent?.pcb_component_id ?? container?.pcb_component_id ?? undefined

    let inserted_pcb_cutout:
      | PcbCutoutRect
      | PcbCutoutCircle
      | PcbCutoutPolygon
      | PcbCutoutPath
      | undefined = undefined

    if (props.shape === "rect") {
      // Use the full global transform so rotations from the footprint,
      // the component and any parent group are all applied.
      const { isFlipped } = this._getPcbPrimitiveFlippedHelpers()
      const transformRotationDegrees =
        (decomposeTSR(this._computePcbGlobalTransformBeforeLayout()).rotation
          .angle *
          180) /
        Math.PI
      let rotationDeg = ((transformRotationDegrees % 360) + 360) % 360
      if (isFlipped) rotationDeg = (360 - rotationDeg) % 360
      const rotationTolerance = 0.01
      const quarterTurns = Math.round(rotationDeg / 90)
      const isAxisAligned =
        Math.abs(rotationDeg - quarterTurns * 90) < rotationTolerance
      const isRotated90 = isAxisAligned && quarterTurns % 2 === 1

      const rectData: Omit<PcbCutoutRect, "type" | "pcb_cutout_id"> = {
        shape: "rect",
        center: globalPosition,
        width: isRotated90 ? props.height : props.width,
        height: isRotated90 ? props.width : props.height,
        ...(isAxisAligned ? {} : { rotation: rotationDeg }),
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id,
        pcb_component_id,
      }
      inserted_pcb_cutout = db.pcb_cutout.insert(rectData)
    } else if (props.shape === "circle") {
      // Circles don't need dimension changes for rotation
      const circleData: Omit<PcbCutoutCircle, "type" | "pcb_cutout_id"> = {
        shape: "circle",
        center: globalPosition,
        radius: props.radius,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id,
        pcb_component_id,
      }
      inserted_pcb_cutout = db.pcb_cutout.insert(circleData)
    } else if (props.shape === "polygon") {
      const transform = this._computePcbGlobalTransformBeforeLayout()
      const transformedPoints = props.points.map((p) =>
        applyToPoint(transform, p),
      )
      const polygonData: Omit<PcbCutoutPolygon, "type" | "pcb_cutout_id"> = {
        shape: "polygon",
        points: transformedPoints,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id,
        pcb_component_id,
      }
      inserted_pcb_cutout = db.pcb_cutout.insert(polygonData)
    }

    if (inserted_pcb_cutout) {
      this.pcb_cutout_id = inserted_pcb_cutout.pcb_cutout_id
    }
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.shape === "rect") {
      return { width: props.width, height: props.height }
    }
    if (props.shape === "circle") {
      return { width: props.radius * 2, height: props.radius * 2 }
    }
    if (props.shape === "polygon") {
      if (props.points.length === 0) return { width: 0, height: 0 }
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity
      for (const point of props.points) {
        minX = Math.min(minX, point.x)
        maxX = Math.max(maxX, point.x)
        minY = Math.min(minY, point.y)
        maxY = Math.max(maxY, point.y)
      }
      return { width: maxX - minX, height: maxY - minY }
    }
    return { width: 0, height: 0 }
  }

  _getPcbCircuitJsonBounds(): {
    center: { x: number; y: number }
    bounds: { left: number; top: number; right: number; bottom: number }
    width: number
    height: number
  } {
    if (!this.pcb_cutout_id) return super._getPcbCircuitJsonBounds()
    const { db } = this.root!
    const cutout = db.pcb_cutout.get(this.pcb_cutout_id)

    if (!cutout) return super._getPcbCircuitJsonBounds()

    if (cutout.shape === "rect") {
      const rotationRad = ((cutout.rotation ?? 0) * Math.PI) / 180
      const cos = Math.abs(Math.cos(rotationRad))
      const sin = Math.abs(Math.sin(rotationRad))
      const width = cutout.width * cos + cutout.height * sin
      const height = cutout.width * sin + cutout.height * cos
      return {
        center: cutout.center,
        bounds: {
          left: cutout.center.x - width / 2,
          top: cutout.center.y + height / 2, // Assuming Y is up
          right: cutout.center.x + width / 2,
          bottom: cutout.center.y - height / 2,
        },
        width,
        height,
      }
    } else if (cutout.shape === "circle") {
      return {
        center: cutout.center,
        bounds: {
          left: cutout.center.x - cutout.radius,
          top: cutout.center.y + cutout.radius,
          right: cutout.center.x + cutout.radius,
          bottom: cutout.center.y - cutout.radius,
        },
        width: cutout.radius * 2,
        height: cutout.radius * 2,
      }
    } else if (cutout.shape === "polygon") {
      if (cutout.points.length === 0) return super._getPcbCircuitJsonBounds()
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity
      for (const point of cutout.points) {
        minX = Math.min(minX, point.x)
        maxX = Math.max(maxX, point.x)
        minY = Math.min(minY, point.y)
        maxY = Math.max(maxY, point.y)
      }
      return {
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        bounds: { left: minX, top: maxY, right: maxX, bottom: minY },
        width: maxX - minX,
        height: maxY - minY,
      }
    }
    return super._getPcbCircuitJsonBounds()
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }): void {
    if (!this.pcb_cutout_id) return
    const { db } = this.root!
    const cutout = db.pcb_cutout.get(this.pcb_cutout_id)
    if (!cutout) return

    if (cutout.shape === "rect" || cutout.shape === "circle") {
      db.pcb_cutout.update(this.pcb_cutout_id, {
        ...cutout,
        center: newCenter,
      } as any)
    } else if (cutout.shape === "polygon") {
      const oldCenter = this._getPcbCircuitJsonBounds().center
      const dx = newCenter.x - oldCenter.x
      const dy = newCenter.y - oldCenter.y
      const newPoints = cutout.points.map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
      }))
      db.pcb_cutout.update(this.pcb_cutout_id, {
        ...cutout,
        points: newPoints,
      } as any)
    }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }): void {
    if (!this.pcb_cutout_id) return
    const { db } = this.root!
    const cutout = db.pcb_cutout.get(this.pcb_cutout_id)
    if (!cutout) return

    if (cutout.shape === "rect" || cutout.shape === "circle") {
      db.pcb_cutout.update(this.pcb_cutout_id, {
        center: { x: cutout.center.x + deltaX, y: cutout.center.y + deltaY },
      })
    } else if (cutout.shape === "polygon") {
      db.pcb_cutout.update(this.pcb_cutout_id, {
        points: cutout.points.map((p) => ({
          x: p.x + deltaX,
          y: p.y + deltaY,
        })),
      })
    }
  }
}
