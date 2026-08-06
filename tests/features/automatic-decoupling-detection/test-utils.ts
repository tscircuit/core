import type { SourceSimpleCapacitor } from "circuit-json"
import type { RootCircuit } from "lib/RootCircuit"

export const getSourceCapacitor = (circuit: RootCircuit, name: string) =>
  circuit.db.source_component
    .list()
    .find(
      (component): component is SourceSimpleCapacitor =>
        component.ftype === "simple_capacitor" && component.name === name,
    )
