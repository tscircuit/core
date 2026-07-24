import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { SourceGroup } from "circuit-json"
import type { PackOutput } from "calculate-packing"

type SourceGroupId = SourceGroup["source_group_id"]

const sourceGroupIsWithinPackedGroup = ({
  db,
  sourceGroupId,
  packedSourceGroupIds,
}: {
  db: CircuitJsonUtilObjects
  sourceGroupId: SourceGroupId
  packedSourceGroupIds: Set<SourceGroupId>
}): boolean => {
  let currentSourceGroup = db.source_group.get(sourceGroupId)

  while (currentSourceGroup) {
    if (packedSourceGroupIds.has(currentSourceGroup.source_group_id)) {
      return true
    }
    if (!currentSourceGroup.parent_source_group_id) {
      return false
    }
    currentSourceGroup = db.source_group.get(
      currentSourceGroup.parent_source_group_id,
    )
  }

  return false
}

export const removeObstaclesDuplicatedByPackedGroups = ({
  db,
  packOutput,
}: {
  db: CircuitJsonUtilObjects
  packOutput: PackOutput
}) => {
  const packedSourceGroupIds = new Set<SourceGroupId>()

  for (const packedComponent of packOutput.components) {
    const packedSourceGroup = db.source_group.get(packedComponent.componentId)
    if (packedSourceGroup) {
      packedSourceGroupIds.add(packedSourceGroup.source_group_id)
    }
  }

  if (packedSourceGroupIds.size === 0 || !packOutput.obstacles) {
    return
  }

  packOutput.obstacles = packOutput.obstacles.filter((obstacle) => {
    const pcbComponent = db.pcb_component.get(obstacle.obstacleId)
    if (!pcbComponent) {
      return true
    }

    const sourceComponent = db.source_component.get(
      pcbComponent.source_component_id,
    )
    if (!sourceComponent?.source_group_id) {
      return true
    }

    return !sourceGroupIsWithinPackedGroup({
      db,
      sourceGroupId: sourceComponent.source_group_id,
      packedSourceGroupIds,
    })
  })
}
