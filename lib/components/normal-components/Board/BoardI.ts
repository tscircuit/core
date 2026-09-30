import type { PcbFold } from "@tscircuit/flex-utils"
import type { LayerRef, PcbVia } from "circuit-json"

export interface BoardI {
  pcbFold?: PcbFold
  componentName: string
  boardThickness: number
  _connectedSchematicPortPairs: Set<string>
  _generatedStitchingViaIds?: Set<PcbVia["pcb_via_id"]>
  allLayers: ReadonlyArray<LayerRef>
  _getBoardCalcVariables(): Record<string, number>
  pcb_board_id?: string | null
}
