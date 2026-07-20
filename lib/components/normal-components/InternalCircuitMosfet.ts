import { isValidElement } from "react"
import { Trace } from "../primitive-components/Trace/Trace"
import { Mosfet } from "./Mosfet"

class InternalCircuitTrace extends Trace {
  doInitialPcbTraceRender(): void {}
}

export class InternalCircuitMosfet extends Mosfet {
  resolveFootprint(): undefined {
    return undefined
  }

  doInitialPcbComponentRender(): void {}

  doInitialReactSubtreesRender(): void {
    const symbol = this.props.symbol
    if (
      isValidElement(symbol) &&
      !this.children.some((child) => child.componentName === "Symbol")
    ) {
      this.add(symbol)
    }
  }

  doInitialCreateTracesFromProps(): void {
    const connections = this._parsedProps.connections
    if (!connections) return

    for (const [pinName, target] of Object.entries(connections)) {
      const targets = Array.isArray(target) ? target : [target]
      for (const targetPath of targets) {
        this.add(
          new InternalCircuitTrace({
            from: `.${this.name} > .${pinName}`,
            to: String(targetPath),
          }),
        )
      }
    }
  }
}
