import { isAssemblyDeviceContainer } from "lib/components/base-components/is-assembly-device-container"
import { updateMissingSchematicSheetWarning } from "lib/utils/schematic/update-missing-schematic-sheet-warning"
import type { Group } from "./Group"

export const Group_doInitialSchematicSheetRender = (
  group: Group<any>,
): void => {
  const root = group.root
  if (!root?.isRootCircuit) return

  const isRootGroup = root.firstChild === group
  const isRootAssemblyChild =
    isAssemblyDeviceContainer(root.firstChild) &&
    group.parent === root.firstChild
  if (!isRootGroup && !isRootAssemblyChild) return

  updateMissingSchematicSheetWarning({
    db: root.db,
    schematicDisabled: root.schematicDisabled,
  })
}

export const Group_updateSchematicSheetRender = (group: Group<any>): void => {
  Group_doInitialSchematicSheetRender(group)
}
