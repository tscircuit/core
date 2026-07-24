import { schematicSymbolProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import { SchematicSymbol_doInitialSchematicComponentRender } from "./SchematicSymbol_doInitialSchematicComponentRender"

export class SchematicSymbol extends PrimitiveComponent<
  typeof schematicSymbolProps
> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicSymbol",
      schematicSymbolName: this.props.symbolName,
      zodProps: schematicSymbolProps,
    }
  }

  doInitialSourceRender(): void {
    const sourceComponent = this.root!.db.source_component.insert({
      ftype: "simple_chip",
      name: this.name,
      are_pins_interchangeable: false,
    })
    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialSchematicComponentRender(): void {
    SchematicSymbol_doInitialSchematicComponentRender(this)
  }

  /*
   * displayName cannot be supported until schematic_component has its own
   * display_name field. Avoid special-casing schematic rendering for it.
   */
}
