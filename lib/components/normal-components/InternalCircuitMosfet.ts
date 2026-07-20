import { isValidElement } from "react"
import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Trace } from "../primitive-components/Trace/Trace"
import type { Chip } from "./Chip"
import { Mosfet } from "./Mosfet"

class InternalCircuitTrace extends Trace {
  doInitialPcbManualTraceRender(): void {}

  doInitialPcbTraceRender(): void {}
}

const getContainingChip = (component: PrimitiveComponent): Chip | undefined => {
  let ancestor = component.parent
  while (ancestor) {
    if (ancestor.componentName === "Chip") return ancestor as Chip
    ancestor = ancestor.parent
  }
  return undefined
}

const resolveInternalConnectionTarget = (
  target: string,
  containingChip: Chip | undefined,
): string => {
  if (!containingChip?.name || !target.startsWith("pin.")) return target
  return `.${containingChip.name} > .${target.slice("pin.".length)}`
}

export class InternalCircuitMosfet extends Mosfet {
  /** Internal circuit components contribute source and schematic elements only. */
  readonly _isSchematicOnly = true

  get name(): string | undefined {
    const internalName = super.name
    const containingChip = getContainingChip(this)
    if (!internalName || !containingChip?.name) return internalName
    return `${containingChip.name}${internalName}`
  }

  resolveFootprint(): undefined {
    return undefined
  }

  doInitialPcbComponentRender(): void {}

  doInitialPcbFootprintStringRender(): void {}

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
    const containingChip = getContainingChip(this)
    const connections = this._parsedProps.connections
    if (!connections) return

    for (const [pinName, target] of Object.entries(connections)) {
      const targets = Array.isArray(target) ? target : [target]
      for (const targetPath of targets) {
        this.add(
          new InternalCircuitTrace({
            from: `.${this.name} > .${pinName}`,
            to: resolveInternalConnectionTarget(
              String(targetPath),
              containingChip,
            ),
          }),
        )
      }
    }
  }
}
