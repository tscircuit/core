import { systemBlockPageProps } from "@tscircuit/props"
import type { SystemBlockPage as SystemBlockPageRecord } from "circuit-json"
import { SystemBlockPrimitive } from "../../base-components/SystemBlockPrimitive"
import { SystemBlockPage_doInitialSystemBlockRender } from "./SystemBlockPage_doInitialSystemBlockRender"

export class SystemBlockPage extends SystemBlockPrimitive<
  typeof systemBlockPageProps
> {
  system_block_page_id?: SystemBlockPageRecord["system_block_page_id"]

  get config() {
    return { componentName: "SystemBlockPage", zodProps: systemBlockPageProps }
  }

  doInitialSystemBlockRender() {
    SystemBlockPage_doInitialSystemBlockRender(this)
  }
  updateSystemBlockRender() {
    SystemBlockPage_doInitialSystemBlockRender(this)
  }

  removeSystemBlockRender() {
    if (!this.system_block_page_id) return
    const { db } = this.root!
    for (const connection of db.system_block_connection.list())
      if (connection.system_block_page_id === this.system_block_page_id)
        db.system_block_connection.delete(connection.system_block_connection_id)
    for (const component of db.system_block_component.list())
      if (component.system_block_page_id === this.system_block_page_id)
        db.system_block_component.delete(component.system_block_component_id)
    for (const group of db.system_block_group.list())
      if (group.system_block_page_id === this.system_block_page_id)
        db.system_block_group.delete(group.system_block_group_id)
    db.system_block_page.delete(this.system_block_page_id)
    this.system_block_page_id = undefined
  }
}
