import { pcbLayoutProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Port } from "./Port"
import type { Net } from "./Net"
import type { ZodType } from "zod"

/**
 * Shared base props for breakout points — layout props without rotation/layer.
 * Subclasses extend this schema with additional fields (e.g. `connection`).
 */
export const baseBreakoutPointProps = pcbLayoutProps.omit({
  pcbRotation: true,
  layer: true,
})

/**
 * Base class for both user-facing `BreakoutPoint` (which requires a
 * `connection` prop) and the internal `AutoplacedBreakoutPoint` (which
 * receives its `matchedPort` programmatically).
 */
export class BaseBreakoutPoint<
  TProps extends ZodType = typeof baseBreakoutPointProps,
> extends PrimitiveComponent<TProps> {
  pcb_breakout_point_id: string | null = null
  matchedPort: Port | null = null
  matchedNet: Net | null = null
  matchedSourceTraceId: string | null = null
  isPcbPrimitive = true

  _getSourceTraceIdForPort(port: Port): string | undefined {
    const { db } = this.root!
    const trace = db.source_trace
      .list()
      .find((st) => st.connected_source_port_ids.includes(port.source_port_id!))
    return trace?.source_trace_id
  }

  _getSourceNetIdForPort(port: Port): string | undefined {
    const { db } = this.root!
    const trace = db.source_trace
      .list()
      .find((st) => st.connected_source_port_ids.includes(port.source_port_id!))
    return trace?.connected_source_net_ids[0]
  }

  _renderPcbBreakoutPoint(): void {
    if (this.pcb_breakout_point_id) return
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const position = this._getGlobalPcbPositionBeforeLayout()
    const group = this.parent?.getGroup()
    const subcircuit = this.getSubcircuit()
    if (!group || !group.pcb_group_id) return
    const pcb_breakout_point = db.pcb_breakout_point.insert({
      pcb_group_id: group.pcb_group_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      source_port_id: this.matchedPort?.source_port_id ?? undefined,
      source_trace_id: this.matchedPort
        ? (this.matchedSourceTraceId ??
          this._getSourceTraceIdForPort(this.matchedPort))
        : undefined,
      source_net_id: this.matchedNet
        ? this.matchedNet.source_net_id
        : this.matchedPort
          ? this._getSourceNetIdForPort(this.matchedPort)
          : undefined,
      x: position.x,
      y: position.y,
    })
    this.pcb_breakout_point_id = pcb_breakout_point.pcb_breakout_point_id
  }

  _getPcbCircuitJsonBounds() {
    const position = this._getGlobalPcbPositionBeforeLayout()
    return {
      center: { x: position.x, y: position.y },
      bounds: {
        left: position.x,
        top: position.y,
        right: position.x,
        bottom: position.y,
      },
      width: 0,
      height: 0,
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    if (!this.pcb_breakout_point_id) return
    const updatedProperties: {
      x: number
      y: number
      source_trace_id?: string
    } = {
      x: newCenter.x,
      y: newCenter.y,
    }
    if (this.matchedSourceTraceId) {
      updatedProperties.source_trace_id = this.matchedSourceTraceId
    }
    db.pcb_breakout_point.update(this.pcb_breakout_point_id, updatedProperties)
  }

  _moveCircuitJsonElements({
    deltaX,
    deltaY,
  }: { deltaX: number; deltaY: number }) {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    if (!this.pcb_breakout_point_id) return

    const point = db.pcb_breakout_point.get(this.pcb_breakout_point_id)

    if (point) {
      db.pcb_breakout_point.update(this.pcb_breakout_point_id, {
        x: point.x + deltaX,
        y: point.y + deltaY,
      })
    }
  }

  getPcbSize() {
    return { width: 0, height: 0 }
  }
}
