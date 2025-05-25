import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicBoxProps } from "@tscircuit/props"
import type { Port } from "./Port"

export class SchematicBox extends PrimitiveComponent<typeof schematicBoxProps> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicSection",
      zodProps: schematicBoxProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    let portsWithSelectors: Array<{ selector: string; port: Port }> = []
    if (props.overlay) {
      portsWithSelectors = props.overlay.map((selector) => ({
        selector,
        port:
          (this.getSubcircuit().selectOne(selector, {
            type: "port",
          }) as Port) ?? null,
      }))
    }
    const portsWithPosition = portsWithSelectors.map(({ port }) => ({
      port,
      position: port._getGlobalSchematicPositionAfterLayout(),
      schematic_port_id: port.schematic_port_id!,
      facingDirection: port.facingDirection,
    }))
    if (portsWithPosition.length > 0) {
      const basePadding = 0.6
      const xs = portsWithPosition.map((p) => p.position.x)
      const ys = portsWithPosition.map((p) => p.position.y)

      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const rawWidth = maxX - minX
      const rawHeight = maxY - minY

      let widthPadding: number
      let heightPadding: number

      if (rawWidth > rawHeight) {
        // Horizontal row → more vertical padding
        widthPadding = basePadding / 2
        heightPadding = basePadding
      } else {
        // Vertical column → more horizontal padding
        widthPadding = basePadding
        heightPadding = basePadding / 2
      }

      const width = rawWidth + widthPadding
      const height = rawHeight + heightPadding

      const x = minX - widthPadding / 2
      const y = minY - heightPadding / 2

      db.schematic_box.insert({
        height,
        width,
        x,
        y,
        is_dashed: props.strokeStyle === "dashed",
        schematic_component_id: "",
      })

      console.log({ rawWidth, rawHeight, width, height })

      db.schematic_box.insert({
        height,
        width,
        x,
        y,
        is_dashed: props.strokeStyle === "dashed",
        schematic_component_id: "",
      })
    }
  }
}
