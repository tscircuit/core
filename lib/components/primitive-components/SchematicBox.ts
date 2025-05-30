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

      // Default padding (only if width or height is zero)
      const defaultHorizontalPadding = rawWidth === 0 ? basePadding : 0
      const defaultVerticalPadding = rawHeight === 0 ? basePadding : 0

      const paddingTop =
        typeof props.paddingTop === "number" ? props.paddingTop : 0
      const paddingBottom =
        typeof props.paddingBottom === "number" ? props.paddingBottom : 0
      const paddingLeft =
        typeof props.paddingLeft === "number" ? props.paddingLeft : 0
      const paddingRight =
        typeof props.paddingRight === "number" ? props.paddingRight : 0

      const totalHorizontalPadding =
        defaultHorizontalPadding + paddingLeft + paddingRight
      const totalVerticalPadding =
        defaultVerticalPadding + paddingTop + paddingBottom

      const width = rawWidth + totalHorizontalPadding
      const height = rawHeight + totalVerticalPadding

      const x = minX - defaultHorizontalPadding / 2 - paddingLeft
      const y = minY - defaultVerticalPadding / 2 - paddingTop

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
