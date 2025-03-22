import { stampboardProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"

export class Stampboard extends NormalComponent<typeof stampboardProps> {
  get config() {
    return {
      componentName: "Stampboard",
      zodProps: stampboardProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSourceRender() {
    if (!this.root) return
    const { db } = this.root

    const source_component = db.source_component.insert({
      ftype: "simple_chip",
      name: this._parsedProps.name ?? "unnamed",
    })

    this.source_component_id = source_component.source_component_id
  }
}
