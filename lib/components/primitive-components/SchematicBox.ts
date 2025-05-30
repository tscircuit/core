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
      portsWithSelectors = props.overlay
        .map((selector) => ({
          selector,
          port: this.getSubcircuit().selectOne(selector, {
            type: "port",
          }) as Port | null,
        }))
        .filter(({ port }) => port != null) as Array<{
        selector: string
        port: Port
      }>
    }

    const portsWithPosition = portsWithSelectors.map(({ port }) => ({
      port,
      position: port._getGlobalSchematicPositionAfterLayout(),
      schematic_port_id: port.schematic_port_id!,
      facingDirection: port.facingDirection,
    }))

    if (portsWithPosition.length > 0) {
      const basePadding = 0.6

      // General padding
      const generalPadding =
        typeof props.padding === "number" ? props.padding : 0

      const xs = portsWithPosition.map((p) => p.position.x)
      const ys = portsWithPosition.map((p) => p.position.y)

      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const rawWidth = maxX - minX
      const rawHeight = maxY - minY

      const defaultHorizontalPadding = rawWidth === 0 ? basePadding : 0
      const defaultVerticalPadding = rawHeight === 0 ? basePadding : 0
      const paddingTop =
        typeof props.paddingTop === "number" ? props.paddingTop : generalPadding
      const paddingBottom =
        typeof props.paddingBottom === "number"
          ? props.paddingBottom
          : generalPadding
      const paddingLeft =
        typeof props.paddingLeft === "number"
          ? props.paddingLeft
          : generalPadding
      const paddingRight =
        typeof props.paddingRight === "number"
          ? props.paddingRight
          : generalPadding

      const width =
        rawWidth + defaultHorizontalPadding + paddingLeft + paddingRight
      const height =
        rawHeight + defaultVerticalPadding + paddingTop + paddingBottom

      // ↓ adjust origin to account for left and bottom padding (Y increases upward)
      const x = minX - defaultHorizontalPadding / 2 - paddingLeft
      const y = minY - defaultVerticalPadding / 2 - paddingBottom

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
