import type { z } from "zod"
import { PrimitiveComponent } from "./PrimitiveComponent"

/** System annotations have no electrical, schematic, or PCB geometry. */
export abstract class SystemBlockPrimitive<
  Props extends z.ZodType,
> extends PrimitiveComponent<Props> {
  override doInitialAssignNameToUnnamedComponents() {}

  doInitialSourceRender() {
    // The general primitive constructor permits absent names for auto-naming.
    // System blocks instead require the names declared by their prop schemas.
    this.config.zodProps.parse(this.props)
    if (
      this.componentName === "SystemBlockPage" &&
      (this.parent?.componentName === "SystemBlockPage" ||
        this.parent?.componentName === "SystemBlockGroup")
    )
      throw new Error(
        "System pages can contain only system blocks, groups, and connections; pages cannot be nested",
      )
    if (
      this.componentName !== "SystemBlockPage" &&
      this.parent?.componentName !== "SystemBlockPage" &&
      this.parent?.componentName !== "SystemBlockGroup"
    ) {
      throw new Error(
        "System blocks, groups, and connections must be inside a systemblock.page or systemblock.group",
      )
    }
    if (
      this.componentName === "SystemBlockComponent" ||
      this.componentName === "SystemBlockConnection"
    ) {
      if (this.children.length)
        throw new Error(
          "System components and connections cannot contain children",
        )
    }
  }

  override onPropsChange() {
    this._markDirty("SystemBlockRender")
  }
  override setProps(props: Partial<z.input<Props>>) {
    // Keep required names and existing descriptions when updating one property.
    super.setProps({ ...this.props, ...props })
  }
  override onChildChanged() {
    this._markDirty("SystemBlockRender")
  }
  override add(child: PrimitiveComponent) {
    super.add(child)
    this._markDirty("SystemBlockRender")
  }
  override remove(child: PrimitiveComponent) {
    super.remove(child)
    this._markDirty("SystemBlockRender")
  }
}
