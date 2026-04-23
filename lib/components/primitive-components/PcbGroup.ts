import { groupProps } from "@tscircuit/props"
import { Group } from "./Group/Group"

export class PcbGroup extends Group<typeof groupProps> {
  get config() {
    return {
      zodProps: groupProps,
      componentName: "PcbGroup",
    }
  }

  override get isGroup() {
    return true
  }

  override doInitialSourceRender() {}

  override doInitialSourceParentAttachment() {}

  override doInitialSchematicComponentRender() {}

  override doInitialSchematicLayout() {}

  override doInitialSchematicTraceRender() {}

  override doInitialSchematicReplaceNetLabelsWithSymbols() {}
}
