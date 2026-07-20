import type { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Trace, type TraceSelectorOptions } from "./Trace/Trace"

export class InternalCircuitTrace extends Trace {
  override _selectOneForConnectedPort<T = PrimitiveComponent>(
    selector: string,
    options?: TraceSelectorOptions,
  ): T | null {
    const internalCircuit = this.parent?.parent
    const owningChip = internalCircuit?.parent

    return (
      owningChip?.selectOne<T>(`:scope > ${selector}`, options) ??
      internalCircuit?.selectOne<T>(selector, options) ??
      super._selectOneForConnectedPort<T>(selector, options)
    )
  }
}
