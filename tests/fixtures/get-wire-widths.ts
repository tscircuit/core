import type { RootCircuit } from "lib/RootCircuit"

export const getWireWidths = (circuit: RootCircuit): number[] =>
  circuit.db.pcb_trace
    .list()
    .flatMap(({ route }) =>
      route
        .filter((point) => point.route_type === "wire")
        .map((point) => point.width),
    )
