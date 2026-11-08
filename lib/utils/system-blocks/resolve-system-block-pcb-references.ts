import type { SystemBlockComponent as SystemBlockComponentRecord } from "circuit-json"
import type { SystemBlockComponent } from "lib/components/primitive-components/SystemBlockComponent"
import type { SystemBlockGroup } from "lib/components/primitive-components/SystemBlockGroup"
import type { SystemBlockPage } from "lib/components/primitive-components/SystemBlockPage/SystemBlockPage"

export function resolveSystemBlockPcbReferences(
  page: SystemBlockPage,
  block: SystemBlockComponent | SystemBlockGroup,
): Pick<SystemBlockComponentRecord, "pcb_component_ids" | "pcb_group_id"> {
  const { pcbComponentName, pcbComponentNames, pcbSubcircuitName } =
    block._parsedProps
  if (!pcbComponentName && !pcbComponentNames && !pcbSubcircuitName) return {}
  const { db } = page.root!
  let subcircuitId = page.getSubcircuit().subcircuit_id
  let pcbGroupId: SystemBlockComponentRecord["pcb_group_id"]
  if (pcbSubcircuitName) {
    const subcircuits = db.source_group
      .list()
      .filter(
        (group) => group.is_subcircuit && group.name === pcbSubcircuitName,
      )
    if (subcircuits.length !== 1)
      throw new Error(
        `System block "${block.name}" requires one PCB subcircuit named "${pcbSubcircuitName}"; found ${subcircuits.length}`,
      )
    subcircuitId = subcircuits[0].subcircuit_id!
    const pcbGroup = db.pcb_group
      .list()
      .find((group) => group.source_group_id === subcircuits[0].source_group_id)
    if (!pcbGroup)
      throw new Error(
        `PCB subcircuit "${pcbSubcircuitName}" has no PCB output for system block "${block.name}"`,
      )
    pcbGroupId = pcbGroup.pcb_group_id
  }
  const names =
    pcbComponentNames ?? (pcbComponentName ? [pcbComponentName] : undefined)
  const pcbComponentIds = names?.map((name) => {
    const pcbComponents = db.pcb_component
      .list()
      .filter(
        (component) =>
          component.subcircuit_id === subcircuitId &&
          db.source_component.get(component.source_component_id)?.name === name,
      )
    if (pcbComponents.length !== 1)
      throw new Error(
        `System block "${block.name}" requires one PCB component named "${name}" in ${pcbSubcircuitName ? `subcircuit "${pcbSubcircuitName}"` : "its owning subcircuit"}; found ${pcbComponents.length}`,
      )
    return pcbComponents[0].pcb_component_id
  })
  return {
    ...(pcbGroupId ? { pcb_group_id: pcbGroupId } : {}),
    ...(pcbComponentIds
      ? { pcb_component_ids: [...new Set(pcbComponentIds)] }
      : {}),
  }
}
