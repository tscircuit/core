import { breakoutPointProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Port } from "./Port"
import type { Net } from "./Net"

export interface ResolvedBreakoutPointTarget {
  sourcePortId: string
  sourceTraceId: string
  x: number
  y: number
  layer?: "top" | "bottom"
}

export class BreakoutPoint extends PrimitiveComponent<
  typeof breakoutPointProps
> {
  pcb_breakout_point_id: string | null = null
  matchedPort: Port | null = null
  matchedNet: Net | null = null
  isPcbPrimitive = true
  private resolvedTarget: ResolvedBreakoutPointTarget | null = null

  setResolvedTarget(target: ResolvedBreakoutPointTarget): void {
    this.resolvedTarget = target
  }

  hasResolvedTarget(): boolean {
    return this.resolvedTarget !== null
  }

  get config() {
    return {
      componentName: "BreakoutPoint",
      zodProps: breakoutPointProps,
    }
  }

  _matchConnection(): void {
    const { connection } = this._parsedProps
    const subcircuit = this.getSubcircuit()
    if (!subcircuit) return
    this.matchedPort = subcircuit.selectOne(connection, {
      type: "port",
    }) as Port
    if (!this.matchedPort) {
      this.matchedNet = subcircuit.selectOne(connection, { type: "net" }) as Net
    }
    if (!this.matchedPort && !this.matchedNet) {
      this.renderError(`Could not find connection target "${connection}"`)
    }
  }

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
    const position = this.resolvedTarget
      ? { x: this.resolvedTarget.x, y: this.resolvedTarget.y }
      : this._getGlobalPcbPositionBeforeLayout()
    const group = this.parent?.getGroup()
    const subcircuit = this.getSubcircuit()
    if (!group || !group.pcb_group_id) return

    if (this.resolvedTarget) {
      const sourceTrace = db.source_trace.get(this.resolvedTarget.sourceTraceId)
      const pcb_breakout_point = db.pcb_breakout_point.insert({
        pcb_group_id: group.pcb_group_id,
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        source_port_id: this.resolvedTarget.sourcePortId,
        source_trace_id: this.resolvedTarget.sourceTraceId,
        source_net_id: sourceTrace?.connected_source_net_ids[0],
        x: position.x,
        y: position.y,
      })
      this.pcb_breakout_point_id = pcb_breakout_point.pcb_breakout_point_id
      return
    }

    this._matchConnection()
    const pcb_breakout_point = db.pcb_breakout_point.insert({
      pcb_group_id: group.pcb_group_id,
      subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
      source_port_id: this.matchedPort?.source_port_id ?? undefined,
      source_trace_id: this.matchedPort
        ? this._getSourceTraceIdForPort(this.matchedPort)
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

  doInitialPcbPrimitiveRender(): void {
    if (this.resolvedTarget) return
    this._renderPcbBreakoutPoint()
  }

  doInitialPcbBreakoutPointRender(): void {
    if (!this.resolvedTarget) return
    this._renderPcbBreakoutPoint()
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
    db.pcb_breakout_point.update(this.pcb_breakout_point_id, {
      x: newCenter.x,
      y: newCenter.y,
    })
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
