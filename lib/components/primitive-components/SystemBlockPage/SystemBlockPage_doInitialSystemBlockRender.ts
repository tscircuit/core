import type {
  SystemBlockComponent as ComponentRecord,
  SystemBlockGroup as GroupRecord,
} from "circuit-json"
import type { SystemBlockComponent } from "../SystemBlockComponent"
import type { SystemBlockGroup } from "../SystemBlockGroup"
import type { SystemBlockPage } from "./SystemBlockPage"
import { collectSystemBlocks } from "lib/utils/system-blocks/collect-system-blocks"
import { layoutSystemBlocks } from "lib/utils/system-blocks/layout-system-blocks"
import { resolveSystemBlockPcbReferences } from "lib/utils/system-blocks/resolve-system-block-pcb-references"

/** Emit resolved page-centered geometry in mm (+X right, +Y up). */
export function SystemBlockPage_doInitialSystemBlockRender(
  page: SystemBlockPage,
) {
  const { db } = page.root!
  const { name, displayName, description, direction } = page._parsedProps
  if (
    db.system_block_page
      .list()
      .some(
        (record) =>
          record.name === name &&
          record.system_block_page_id !== page.system_block_page_id,
      )
  )
    throw new Error(`Duplicate system page name "${name}"`)
  const tree = collectSystemBlocks(page)
  const layout = layoutSystemBlocks(tree, direction)
  const associations = new Map(
    [...tree.groups, ...tree.components].map((block) => [
      block,
      resolveSystemBlockPcbReferences(page, block),
    ]),
  )
  // Validate and lay out before replacing an existing page's records.
  page.removeSystemBlockRender()
  const pageRecord = db.system_block_page.insert({
    name,
    display_name: displayName,
    description,
    width: layout.width,
    height: layout.height,
  })
  page.system_block_page_id = pageRecord.system_block_page_id
  const groupIds = new Map<
    SystemBlockGroup,
    GroupRecord["system_block_group_id"]
  >()
  for (const group of tree.groups) {
    const parent = tree.parents.get(group)
    const record = db.system_block_group.insert({
      system_block_page_id: page.system_block_page_id,
      parent_system_block_group_id: parent ? groupIds.get(parent) : undefined,
      name: group.name,
      display_name: group._parsedProps.displayName,
      description: group._parsedProps.description,
      ...layout.bounds.get(group)!,
      ...associations.get(group),
    })
    groupIds.set(group, record.system_block_group_id)
  }
  const componentIds = new Map<
    SystemBlockComponent,
    ComponentRecord["system_block_component_id"]
  >()
  for (const component of tree.components) {
    const parent = tree.parents.get(component)
    const record = db.system_block_component.insert({
      system_block_page_id: page.system_block_page_id,
      system_block_group_id: parent ? groupIds.get(parent) : undefined,
      name: component.name,
      display_name: component._parsedProps.displayName,
      description: component._parsedProps.description,
      ...layout.bounds.get(component)!,
      ...associations.get(component),
    })
    componentIds.set(component, record.system_block_component_id)
  }
  for (const connection of tree.connections) {
    const { from, to } = tree.endpoints.get(connection)!
    const { name, kind, direction, label } = connection._parsedProps
    db.system_block_connection.insert({
      system_block_page_id: page.system_block_page_id,
      from_system_block_component_id: componentIds.get(from)!,
      to_system_block_component_id: componentIds.get(to)!,
      name,
      label,
      direction,
      is_signal: kind === "signal",
      is_power: kind === "power",
      ...layout.routes.get(connection)!,
    })
  }
}
