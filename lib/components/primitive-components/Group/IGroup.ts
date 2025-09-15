import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent";
import type { Size } from "circuit-json";

export interface IGroup extends PrimitiveComponent {
  source_group_id: string | null;
  pcb_group_id: string | null;

  _getSchematicLayoutMode(): "match-adapt" | "flex" | "grid" | "relative";
  _getMinimumFlexContainerSize(): Size | null;
  _repositionOnPcb(position: { x: number; y: number }): void;
  _repositionOnSchematic(position: { x: number; y: number }): void;
}
