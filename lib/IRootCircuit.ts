import type { IIsolatedCircuit } from "./IIsolatedCircuit"

export interface IRootCircuit extends IIsolatedCircuit {
  pcbDisabled: boolean
  schematicDisabled: boolean
  pcbRoutingDisabled: boolean
  partsEngineDisabled: boolean
}
