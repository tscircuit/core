import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { traceHintProps } from "@tscircuit/props"
import type { Port } from "./Port"
import type { RouteHintPoint } from "circuit-json"
import { applyToPoint } from "transformation-matrix"

export class TraceHint extends PrimitiveComponent<typeof traceHintProps> {
  matchedPort: Port | null = null

  get config() {
    return {
      componentName: "TraceHint",
      zodProps: traceHintProps,
    }
  }

  doInitialPortMatching(): void {
    const { db } = this.root!
    const { _parsedProps: props, parent } = this

    if (!parent) return

    if (parent.componentName === "Trace") {
      this.renderError(
        `Port inference inside trace is not yet supported (${this})`,
      )
      return
    }

    if (!parent) throw new Error("TraceHint has no parent")

    if (!props.for) {
      this.renderError(`TraceHint has no for property (${this})`)
      return
    }

    const port = parent.selectOne(props.for, { type: "port" }) as Port

    if (!port) {
      this.renderError(
        `${this} could not find port for selector "${props.for}"`,
      )
    }

    this.matchedPort = port
    port.registerMatch(this)
  }

  getPcbRouteHints(): Array<RouteHintPoint> {
    const { _parsedProps: props } = this

    const offsets = props.offset ? [props.offset] : props.offsets

    if (!offsets) return []

    const globalTransform = this._computePcbGlobalTransformBeforeLayout()

    return offsets.map(
      (offset): RouteHintPoint => ({
        ...applyToPoint(globalTransform, offset),
        via: offset.via,
        to_layer: (offset as any).to_layer,
        trace_width: (offset as any).trace_width,
      }),
    )
  }

  doInitialPcbTraceHintRender(): void {
    if (this.getInheritedProperty("pcbDisabled")) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    db.pcb_trace_hint.insert({
      pcb_component_id: this.matchedPort?.pcb_component_id!,
      pcb_port_id: this.matchedPort?.pcb_port_id!,
      route: this.getPcbRouteHints(),
    })
  }
}
