import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { transformFootprintInsertionDirection } from "lib/utils/pcb/transform-footprint-insertion-direction"

export const updatePcbInsertionDirection = ({
  db,
  pcbComponentId,
  rotationDegrees,
}: {
  db: CircuitJsonUtilObjects
  pcbComponentId: string
  rotationDegrees: number
}) => {
  if (rotationDegrees == null) return

  const pcbComponent = db.pcb_component.get(pcbComponentId)
  if (!pcbComponent?.insertion_direction) return

  const nextDirection = transformFootprintInsertionDirection({
    insertionDirection: pcbComponent.insertion_direction,
    rotationDegrees,
  })

  if (!nextDirection) return

  db.pcb_component.update(pcbComponentId, {
    insertion_direction: nextDirection,
  })
  pcbComponent.insertion_direction = nextDirection
}
