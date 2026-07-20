import { isValidElement } from "react"
import { Mosfet } from "./Mosfet"

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
}
