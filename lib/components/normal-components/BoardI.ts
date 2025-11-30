import type { LayerRef } from "circuit-json"

export interface BoardI {
  componentName: string
  boardThickness: number
  _connectedSchematicPortPairs: Set<string>
  allLayers: ReadonlyArray<LayerRef>
  _getBoardCalcVariables(): Record<string, number>
}
