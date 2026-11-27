import { courtyardPillProps } from "@tscircuit/props"
import { applyToPoint, decomposeTSR } from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

const ANGLE_EPSILON = 1e-4
const ARC_SEGMENTS_PER_CORNER = 8

function createLocalRoundedRectOutline(
  width: number,
  height: number,
  rawRadius: number,
): Array<{ x: number; y: number }> {
  const halfW = width / 2
  const halfH = height / 2
  const r = Math.max(0, Math.min(rawRadius, halfW, halfH))
  if (r <= ANGLE_EPSILON) {
    return [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH },
    ]
  }

  const corners = [
    { cx: halfW - r, cy: halfH - r, start: 0, end: Math.PI / 2 },
    { cx: -halfW + r, cy: halfH - r, start: Math.PI / 2, end: Math.PI },
    { cx: -halfW + r, cy: -halfH + r, start: Math.PI, end: (3 * Math.PI) / 2 },
    {
      cx: halfW - r,
      cy: -halfH + r,
      start: (3 * Math.PI) / 2,
      end: 2 * Math.PI,
    },
  ]

  const pts: Array<{ x: number; y: number }> = []
  for (const corner of corners) {
    for (let i = 0; i <= ARC_SEGMENTS_PER_CORNER; i++) {
      const a =
        corner.start +
        ((corner.end - corner.start) * i) / ARC_SEGMENTS_PER_CORNER
      const pt = {
        x: corner.cx + r * Math.cos(a),
        y: corner.cy + r * Math.sin(a),
      }
      const prev = pts[pts.length - 1]
      if (!prev || Math.hypot(pt.x - prev.x, pt.y - prev.y) > ANGLE_EPSILON) {
        pts.push(pt)
      }
    }
  }
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (
    first &&
    last &&
    pts.length > 1 &&
    Math.hypot(first.x - last.x, first.y - last.y) <= ANGLE_EPSILON
  ) {
    pts.pop()
  }
  return pts
}

export class CourtyardPill extends PrimitiveComponent<
  typeof courtyardPillProps
> {
  pcb_courtyard_pill_id: string | null = null
  pcb_courtyard_outline_id: string | null = null
  isPcbPrimitive = true

  get config() {
    return {
      componentName: "CourtyardPill",
      zodProps: courtyardPillProps,
    }
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const { maybeFlipLayer } = this._getPcbPrimitiveFlippedHelpers()
    const layer = maybeFlipLayer(props.layer ?? "top") as "top" | "bottom"

    if (layer !== "top" && layer !== "bottom") {
      throw new Error(
        `Invalid layer "${layer}" for CourtyardPill. Must be "top" or "bottom".`,
      )
    }

    const subcircuit = this.getSubcircuit()

    const pcb_component_id =
      this.parent?.pcb_component_id ??
      this.getPrimitiveContainer()?.pcb_component_id!

    const globalTransform = this._computePcbGlobalTransformBeforeLayout()
    const decomposedTransform = decomposeTSR(globalTransform)
    const ccwRotationDegrees =
      ((((decomposedTransform.rotation.angle * 180) / Math.PI) % 360) + 360) %
      360

    const isAxisAligned =
      Math.abs(ccwRotationDegrees) < ANGLE_EPSILON ||
      Math.abs(ccwRotationDegrees - 180) < ANGLE_EPSILON ||
      Math.abs(ccwRotationDegrees - 360) < ANGLE_EPSILON
    const isQuarterTurn =
      Math.abs(ccwRotationDegrees - 90) < ANGLE_EPSILON ||
      Math.abs(ccwRotationDegrees - 270) < ANGLE_EPSILON

    if (isAxisAligned || isQuarterTurn) {
      const width = isQuarterTurn ? props.height : props.width
      const height = isQuarterTurn ? props.width : props.height
      const pcb_courtyard_pill = db.pcb_courtyard_pill.insert({
        pcb_component_id,
        layer,
        center: {
          x: position.x,
          y: position.y,
        },
        width,
        height,
        radius: props.radius,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      })

      this.pcb_courtyard_pill_id = pcb_courtyard_pill.pcb_courtyard_pill_id
      return
    }

    // circuit-json's pcb_courtyard_pill has no rotation field; emit arbitrary-angle
    // pills as a rotated pcb_courtyard_outline polygon so DRC/checks test exact geometry.
    const localOutline = createLocalRoundedRectOutline(
      props.width,
      props.height,
      props.radius,
    )
    const outline = localOutline.map((pt) => applyToPoint(globalTransform, pt))
    const pcb_courtyard_outline = db.pcb_courtyard_outline.insert({
      pcb_component_id,
      layer,
      outline,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
    })

    this.pcb_courtyard_outline_id =
      pcb_courtyard_outline.pcb_courtyard_outline_id
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    return { width: props.width, height: props.height }
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (this.pcb_courtyard_pill_id) {
      const pill = db.pcb_courtyard_pill.get(this.pcb_courtyard_pill_id)
      if (pill) {
        db.pcb_courtyard_pill.update(this.pcb_courtyard_pill_id, {
          center: {
            x: pill.center.x + deltaX,
            y: pill.center.y + deltaY,
          },
        })
      }
    }
    if (this.pcb_courtyard_outline_id) {
      const outlineElm = db.pcb_courtyard_outline.get(
        this.pcb_courtyard_outline_id,
      )
      if (outlineElm) {
        db.pcb_courtyard_outline.update(this.pcb_courtyard_outline_id, {
          outline: outlineElm.outline.map((pt) => ({
            x: pt.x + deltaX,
            y: pt.y + deltaY,
          })),
        })
      }
    }
  }
}
