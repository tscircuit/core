import type { PcbFold } from "@tscircuit/flex-utils"
import type { LayerRef, PcbCopperPour, PcbVia } from "circuit-json"

export interface BoardI {
  pcbFold?: PcbFold
  componentName: string
  boardThickness: number
  _connectedSchematicPortPairs: Set<string>
  _generatedCopperPourIds?: Set<PcbCopperPour["pcb_copper_pour_id"]>
  _generatedStitchingViaIds?: Set<PcbVia["pcb_via_id"]>
  allLayers: ReadonlyArray<LayerRef>
  _getBoardCalcVariables(): Record<string, number>
  pcb_board_id?: string | null
}
