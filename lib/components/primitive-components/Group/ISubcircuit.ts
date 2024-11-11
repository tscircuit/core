import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { SubcircuitGroupProps } from "@tscircuit/props"

export interface ISubcircuit extends PrimitiveComponent {
  _shouldUseTraceByTraceRouting(): boolean
  _parsedProps: SubcircuitGroupProps
}
