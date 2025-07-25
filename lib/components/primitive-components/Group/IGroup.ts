import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

export interface IGroup extends PrimitiveComponent {
  source_group_id: string | null
  pcb_group_id: string | null

  _getSchematicLayoutMode(): "match-adapt" | "flex" | "grid" | "relative"
}
