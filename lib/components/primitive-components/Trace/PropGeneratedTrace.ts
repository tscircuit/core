import { Trace } from "./Trace"

export class PropGeneratedTrace extends Trace {
  override _shouldWarnIfUnnamed(): boolean {
    return false
  }
}
