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
    console.log("portsWithPosition", portsWithPosition)
    if (portsWithPosition.length > 0) {
      const padding = 1

      const xs = portsWithPosition.map((p) => p.position.x)
      const ys = portsWithPosition.map((p) => p.position.y)

      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const rawWidth = maxX - minX
      const rawHeight = maxY - minY

      const width = rawWidth === 0 ? padding * 2 : rawWidth + padding * 2
      const height = rawHeight === 0 ? padding * 2 : rawHeight + padding * 2

      const x = minX - padding
      const y = minY - padding
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
