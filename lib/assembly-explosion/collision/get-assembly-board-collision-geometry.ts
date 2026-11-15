import type { AnyCircuitElement } from "circuit-json"

export function getAssemblyBoardCollisionGeometry(
  circuitJson: AnyCircuitElement[],
) {
  const printedParts = new Map(
    circuitJson.flatMap((record) => {
      if (record.type === "source_component" && record.ftype === "printedpart")
        return [[record.source_component_id, record] as const]
      return []
    }),
  )
  return {
    printedParts,
    boards: circuitJson.filter((record) => record.type === "pcb_board"),
    cad: circuitJson.filter(
      (record) =>
        record.type === "cad_component" &&
        printedParts.has(record.source_component_id),
    ),
  }
}
