import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { AutorouterConfig, subcircuitGroupProps } from "@tscircuit/props"
import { z } from "zod"

export interface ISubcircuit extends PrimitiveComponent {
  _shouldUseTraceByTraceRouting(): boolean
  _parsedProps: z.infer<typeof subcircuitGroupProps>
  _getAutorouterConfig(): AutorouterConfig
  getNextAvailableName(elm: PrimitiveComponent): string
  _getSubcircuitLayerCount(): number
  subcircuit_id: string | null
}
