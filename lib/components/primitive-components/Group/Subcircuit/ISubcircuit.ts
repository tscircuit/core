import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import type { AutorouterConfig, subcircuitGroupProps } from "@tscircuit/props"
import { z } from "zod"
import type { AnyCircuitElement } from "circuit-json"

export interface ISubcircuit extends PrimitiveComponent {
  _shouldUseTraceByTraceRouting(): boolean
  _parsedProps: z.infer<typeof subcircuitGroupProps>
  _getAutorouterConfig(): AutorouterConfig
  _isAutoJumperAutorouter(autorouterConfig?: AutorouterConfig): boolean
  getNextAvailableName(elm: PrimitiveComponent): string
  _getSubcircuitLayerCount(): number
  subcircuit_id: string | null
  getNormalComponentNameMap?: () => Map<string, NormalComponent[]>
  _isInflatedFromCircuitJson: boolean
  _isIsolatedSubcircuit: boolean
  _isolatedCircuitJson: AnyCircuitElement[] | null
  _normalComponentNameMap: Map<string, NormalComponent[]> | null
  getSubcircuitPropHash?(): string
}
