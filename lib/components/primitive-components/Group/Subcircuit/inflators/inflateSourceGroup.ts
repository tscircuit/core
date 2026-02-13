import type { SourceGroup } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Group } from "lib/components/primitive-components/Group/Group"
import { Subcircuit } from "lib/components/primitive-components/Group/Subcircuit/Subcircuit"

export function inflateSourceGroup(
  sourceGroup: SourceGroup,
  inflatorContext: InflatorContext,
) {
  const { subcircuit, groupsMap } = inflatorContext

  const groupName =
    sourceGroup.name ?? `inflated_group_${sourceGroup.source_group_id}`

  const group = sourceGroup.is_subcircuit
    ? new Subcircuit({ name: groupName })
    : new Group({ name: groupName })

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
