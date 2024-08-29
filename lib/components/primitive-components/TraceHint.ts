import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { traceHintProps } from "@tscircuit/props"
import type { Port } from "./Port"
import type { RouteHintPoint } from "@tscircuit/soup"
import { applyToPoint } from "transformation-matrix"

export class TraceHint extends PrimitiveComponent<typeof traceHintProps> {
  matchedPort: Port | null = null

  doInitialPortMatching(): void {
    const { db } = this.project!
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

    const globalTransform = this.computePcbGlobalTransform()

    return offsets.map(
      (offset): RouteHintPoint => ({
        ...applyToPoint(globalTransform, offset),
        via: offset.via,
        to_layer: (offset as any).to_layer,
        trace_width: (offset as any).trace_width,
      }),
    )
  }
}
