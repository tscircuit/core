import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { applyToPoint } from "transformation-matrix"
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

    // Get parent rotation like SmtPad does
    const container = this.getPrimitiveContainer()
    const parentRotation = container?._parsedProps.pcbRotation ?? 0

    let inserted_pcb_cutout:
      | PcbCutoutRect
      | PcbCutoutCircle
      | PcbCutoutPolygon
      | PcbCutoutPath
      | undefined = undefined

    if (props.shape === "rect") {
      // Handle rotation by swapping width/height for 90-degree rotations
      const rotationDeg =
        typeof parentRotation === "string"
          ? parseInt(parentRotation.replace("deg", ""), 10)
          : parentRotation
      const isRotated90 = Math.abs(rotationDeg % 180) === 90

      const rectData: Omit<PcbCutoutRect, "type" | "pcb_cutout_id"> = {
        shape: "rect",
        center: globalPosition,
        width: isRotated90 ? props.height : props.width,
        height: isRotated90 ? props.width : props.height,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id,
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
      return {
        center: cutout.center,
        bounds: {
          left: cutout.center.x - cutout.width / 2,
          top: cutout.center.y + cutout.height / 2, // Assuming Y is up
          right: cutout.center.x + cutout.width / 2,
          bottom: cutout.center.y - cutout.height / 2,
        },
        width: cutout.width,
        height: cutout.height,
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
