import { breakoutProps } from "@tscircuit/props"
import { Group } from "../Group/Group"
import type { z } from "zod"

type Point = { x: number; y: number }

export class Breakout extends Group<typeof breakoutProps> {
  constructor(props: z.input<typeof breakoutProps>) {
    super(props)
  }

  override get isGroup() {
    return true
  }

  doInitialPcbPrimitiveRender(): void {
    super.doInitialPcbPrimitiveRender()
    this._applyBreakoutPadding()
  }

  updatePcbPrimitiveRender(): void {
    super.updatePcbPrimitiveRender()
    this._applyBreakoutPadding()
  }

  doInitialPcbTraceRender(): void {
    this._projectExplicitBreakoutPointsToBoundary()
    this._createAutomaticBreakoutPointsForExternalTraces()
  }

  _applyBreakoutPadding(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const props = this._parsedProps as z.infer<typeof breakoutProps>
    if (!this.pcb_group_id) return
    const pcb_group = db.pcb_group.get(this.pcb_group_id)!
    const padLeft = props.paddingLeft ?? props.padding ?? 0
    const padRight = props.paddingRight ?? props.padding ?? 0
    const padTop = props.paddingTop ?? props.padding ?? 0
    const padBottom = props.paddingBottom ?? props.padding ?? 0
    db.pcb_group.update(this.pcb_group_id, {
      width: (pcb_group.width ?? 0) + padLeft + padRight,
      height: (pcb_group.height ?? 0) + padTop + padBottom,
      center: {
        x: pcb_group.center.x + (padRight - padLeft) / 2,
        y: pcb_group.center.y + (padTop - padBottom) / 2,
      },
    })
  }

  _getPcbGroupBounds(): {
    minX: number
    maxX: number
    minY: number
    maxY: number
    center: Point
  } | null {
    if (!this.pcb_group_id) return null
    const pcbGroup = this.root?.db.pcb_group.get(this.pcb_group_id)
    if (!pcbGroup?.width || !pcbGroup.height) return null
    return {
      minX: pcbGroup.center.x - pcbGroup.width / 2,
      maxX: pcbGroup.center.x + pcbGroup.width / 2,
      minY: pcbGroup.center.y - pcbGroup.height / 2,
      maxY: pcbGroup.center.y + pcbGroup.height / 2,
      center: pcbGroup.center,
    }
  }

  _projectPointTowardBoundary(from: Point, toward: Point): Point | null {
    const bounds = this._getPcbGroupBounds()
    if (!bounds) return null

    let dx = toward.x - from.x
    let dy = toward.y - from.y

    if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
      dx = from.x - bounds.center.x
      dy = from.y - bounds.center.y
    }

    if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
      dx = 1
      dy = 0
    }

    const candidates: Point[] = []
    if (Math.abs(dx) > 1e-9) {
      for (const x of [bounds.minX, bounds.maxX]) {
        const t = (x - from.x) / dx
        const y = from.y + t * dy
        if (t > 0 && y >= bounds.minY - 1e-6 && y <= bounds.maxY + 1e-6) {
          candidates.push({
            x,
            y: Math.min(bounds.maxY, Math.max(bounds.minY, y)),
          })
        }
      }
    }
    if (Math.abs(dy) > 1e-9) {
      for (const y of [bounds.minY, bounds.maxY]) {
        const t = (y - from.y) / dy
        const x = from.x + t * dx
        if (t > 0 && x >= bounds.minX - 1e-6 && x <= bounds.maxX + 1e-6) {
          candidates.push({
            x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
            y,
          })
        }
      }
    }

    if (candidates.length === 0) {
      const clamped = {
        x: Math.min(bounds.maxX, Math.max(bounds.minX, toward.x)),
        y: Math.min(bounds.maxY, Math.max(bounds.minY, toward.y)),
      }
      const distances = [
        { side: "left", distance: Math.abs(clamped.x - bounds.minX) },
        { side: "right", distance: Math.abs(clamped.x - bounds.maxX) },
        { side: "bottom", distance: Math.abs(clamped.y - bounds.minY) },
        { side: "top", distance: Math.abs(clamped.y - bounds.maxY) },
      ].sort((a, b) => a.distance - b.distance)
      if (distances[0].side === "left") clamped.x = bounds.minX
      if (distances[0].side === "right") clamped.x = bounds.maxX
      if (distances[0].side === "bottom") clamped.y = bounds.minY
      if (distances[0].side === "top") clamped.y = bounds.maxY
      return clamped
    }

    return candidates.sort((a, b) => {
      const da = (a.x - from.x) ** 2 + (a.y - from.y) ** 2
      const db = (b.x - from.x) ** 2 + (b.y - from.y) ** 2
      return da - db
    })[0]
  }

  _projectExplicitBreakoutPointsToBoundary(): void {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_group_id) return
    const { db } = this.root!
    const bounds = this._getPcbGroupBounds()
    if (!bounds) return

    for (const breakoutPoint of db.pcb_breakout_point
      .list()
      .filter((bp) => bp.pcb_group_id === this.pcb_group_id)) {
      const projected = this._projectPointTowardBoundary(bounds.center, {
        x: breakoutPoint.x,
        y: breakoutPoint.y,
      })
      if (!projected) continue
      db.pcb_breakout_point.update(breakoutPoint.pcb_breakout_point_id, {
        x: projected.x,
        y: projected.y,
      })
    }
  }

  _createAutomaticBreakoutPointsForExternalTraces(): void {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_group_id) return
    const { db } = this.root!

    const descendantSourcePortIds = new Set(
      this.getDescendants()
        .filter((component) => component.componentName === "Port")
        .map((port) => (port as any).source_port_id)
        .filter((sourcePortId): sourcePortId is string =>
          Boolean(sourcePortId),
        ),
    )
    if (descendantSourcePortIds.size === 0) return

    const existingBreakoutPoints = db.pcb_breakout_point
      .list()
      .filter((bp) => bp.pcb_group_id === this.pcb_group_id)

    for (const sourceTrace of db.source_trace.list()) {
      const insideSourcePortIds = sourceTrace.connected_source_port_ids.filter(
        (sourcePortId) => descendantSourcePortIds.has(sourcePortId),
      )
      if (insideSourcePortIds.length === 0) continue

      const outsidePcbPorts = sourceTrace.connected_source_port_ids
        .filter((sourcePortId) => !descendantSourcePortIds.has(sourcePortId))
        .map((sourcePortId) =>
          db.pcb_port.getWhere({ source_port_id: sourcePortId }),
        )
        .filter((pcbPort): pcbPort is NonNullable<typeof pcbPort> =>
          Boolean(pcbPort?.x !== undefined && pcbPort?.y !== undefined),
        )
      if (outsidePcbPorts.length === 0) continue

      const outsideTarget = {
        x:
          outsidePcbPorts.reduce((sum, pcbPort) => sum + pcbPort.x!, 0) /
          outsidePcbPorts.length,
        y:
          outsidePcbPorts.reduce((sum, pcbPort) => sum + pcbPort.y!, 0) /
          outsidePcbPorts.length,
      }

      for (const sourcePortId of insideSourcePortIds) {
        if (
          existingBreakoutPoints.some(
            (bp) =>
              bp.source_port_id === sourcePortId ||
              bp.source_trace_id === sourceTrace.source_trace_id,
          )
        ) {
          continue
        }

        const insidePcbPort = db.pcb_port.getWhere({
          source_port_id: sourcePortId,
        })
        if (insidePcbPort?.x === undefined || insidePcbPort.y === undefined) {
          continue
        }

        const projected = this._projectPointTowardBoundary(
          { x: insidePcbPort.x, y: insidePcbPort.y },
          outsideTarget,
        )
        if (!projected) continue

        db.pcb_breakout_point.insert({
          pcb_group_id: this.pcb_group_id,
          subcircuit_id: this.getSubcircuit()?.subcircuit_id ?? undefined,
          source_port_id: sourcePortId,
          source_trace_id: sourceTrace.source_trace_id,
          source_net_id: sourceTrace.connected_source_net_ids[0],
          x: projected.x,
          y: projected.y,
        })
      }
    }
  }
}
