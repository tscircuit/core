import type { LayerRef, PcbVia } from "circuit-json"

export interface BoardI {
  componentName: string
  boardThickness: number
  _connectedSchematicPortPairs: Set<string>
  _generatedStitchingViaIds?: Set<PcbVia["pcb_via_id"]>
  allLayers: ReadonlyArray<LayerRef>
  _getBoardCalcVariables(): Record<string, number>
  pcb_board_id?: string | null
}
