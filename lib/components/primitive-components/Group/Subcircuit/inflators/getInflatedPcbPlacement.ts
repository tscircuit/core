import type { PcbComponent } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"

export const getInflatedPcbPlacement = ({
  pcbComponent,
  sourceGroupId,
  inflatorContext,
}: {
  pcbComponent: PcbComponent | null
  sourceGroupId?: string | null
  inflatorContext: InflatorContext
}): { pcbX: number | undefined; pcbY: number | undefined } => {
  if (!pcbComponent?.center) {
    return { pcbX: undefined, pcbY: undefined }
  }

  if (sourceGroupId) {
    const parentPcbGroup = inflatorContext.injectionDb.pcb_group.getWhere({
      source_group_id: sourceGroupId,
    })

    if (parentPcbGroup?.anchor_position) {
      return {
        pcbX: pcbComponent.center.x - parentPcbGroup.anchor_position.x,
        pcbY: pcbComponent.center.y - parentPcbGroup.anchor_position.y,
      }
    }
  }

  return {
    pcbX: pcbComponent.center.x,
    pcbY: pcbComponent.center.y,
  }
}
