import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export interface ISubcircuit extends PrimitiveComponent {
  _shouldUseTraceByTraceRouting(): boolean
}
