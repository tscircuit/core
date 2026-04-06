import type { PcbGroup, SourceGroup } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Group } from "lib/components/primitive-components/Group/Group"
import type { GroupProps, SubcircuitGroupProps } from "@tscircuit/props"

export function inflateSourceGroup(
  sourceGroup: SourceGroup,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbGroup = injectionDb.pcb_group.getWhere({
    source_group_id: sourceGroup.source_group_id,
  }) as PcbGroup | null

  const groupProps: GroupProps = {
    name: sourceGroup.name ?? `inflated_group_${sourceGroup.source_group_id}`,
  }

  if (
    pcbGroup?.position_mode === "relative_to_group_anchor" &&
    pcbGroup.anchor_position
  ) {
    let baseAnchor = { x: 0, y: 0 }

    if (sourceGroup.parent_source_group_id) {
      const parentPcbGroup = injectionDb.pcb_group.getWhere({
        source_group_id: sourceGroup.parent_source_group_id,
      }) as PcbGroup | null

      if (parentPcbGroup?.anchor_position) {
        baseAnchor = parentPcbGroup.anchor_position
      }
    }

    groupProps.pcbX = pcbGroup.anchor_position.x - baseAnchor.x
    groupProps.pcbY = pcbGroup.anchor_position.y - baseAnchor.y
  }

  if (pcbGroup?.anchor_alignment) {
    groupProps.pcbAnchorAlignment = pcbGroup.anchor_alignment
  }

  // Create a Group instance
  const group = new Group(groupProps)
  group._isInflatedFromCircuitJson = true

  // Set the source_group_id so the group can be found
  group.source_group_id = sourceGroup.source_group_id

  // Add to the groups map for later reference
  if (groupsMap) {
    groupsMap.set(sourceGroup.source_group_id, group)
  }

  // Add the group to its parent if it has one, otherwise add to subcircuit
  if (
    sourceGroup.parent_source_group_id &&
    groupsMap?.has(sourceGroup.parent_source_group_id)
  ) {
    const parentGroup = groupsMap.get(sourceGroup.parent_source_group_id)!
    parentGroup.add(group)
  } else {
    subcircuit.add(group)
  }

  return group
}
