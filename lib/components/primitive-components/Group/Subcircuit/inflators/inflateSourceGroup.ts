import type { SourceGroup } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Group } from "lib/components/primitive-components/Group/Group"

export function inflateSourceGroup(
  sourceGroup: SourceGroup,
  inflatorContext: InflatorContext,
) {
  const { subcircuit, groupsMap } = inflatorContext

  // Create a Group instance
  const group = new Group({
    name: sourceGroup.name,
  })

  // Set the source_group_id so the group can be found
  group.source_group_id = sourceGroup.source_group_id

  subcircuit.add(group)

  // Add to the groups map for later reference
  if (groupsMap) {
    groupsMap.set(sourceGroup.source_group_id, group)
  }

  return group
}
