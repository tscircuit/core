import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { traceHintProps } from "@tscircuit/props"
import type { Port } from "./Port"

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
}
