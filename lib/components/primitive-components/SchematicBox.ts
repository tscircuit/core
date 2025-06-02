import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicBoxProps } from "@tscircuit/props"
import type { Port } from "./Port"

export class SchematicBox extends PrimitiveComponent<typeof schematicBoxProps> {
  isSchematicPrimitive = true

  get config() {
    return {
      componentName: "SchematicBox",
      zodProps: schematicBoxProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const result = schematicBoxProps.safeParse(props)
    if (!result.success) {
      console.error("Validation failed:", result.error.format())
      throw result.error
    }

    let width: number
    let height: number
    let centerX: number = typeof props.schX === "number" ? props.schX : 0
    let centerY: number = typeof props.schY === "number" ? props.schY : 0

    const basePadding = 0.6
    const generalPadding = typeof props.padding === "number" ? props.padding : 0
    const paddingTop =
      typeof props.paddingTop === "number" ? props.paddingTop : generalPadding
    const paddingBottom =
      typeof props.paddingBottom === "number"
        ? props.paddingBottom
        : generalPadding
    const paddingLeft =
      typeof props.paddingLeft === "number" ? props.paddingLeft : generalPadding
    const paddingRight =
      typeof props.paddingRight === "number"
        ? props.paddingRight
        : generalPadding

    const hasOverlay = props.overlay && props.overlay.length > 0
    const hasFixedSize =
      typeof props.width === "number" && typeof props.height === "number"

    if (hasOverlay) {
      const portsWithSelectors = (props.overlay as string[])
        .map((selector: string) => ({
          selector,
          port: this.getSubcircuit().selectOne(selector, {
            type: "port",
          }) as Port | null,
        }))
        .filter(({ port }) => port != null) as Array<{
        selector: string
        port: Port
      }>

      const portsWithPosition = portsWithSelectors.map(({ port }) => ({
        port,
        position: port._getGlobalSchematicPositionAfterLayout(),
        schematic_port_id: port.schematic_port_id!,
        facingDirection: port.facingDirection,
      }))

      if (portsWithPosition.length === 0) return

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

      width = rawWidth + defaultHorizontalPadding + paddingLeft + paddingRight
      height = rawHeight + defaultVerticalPadding + paddingTop + paddingBottom
      centerX = (minX + maxX) / 2 + (props.schX ?? 0)
      centerY = (minY + maxY) / 2 + (props.schY ?? 0)
    } else if (hasFixedSize) {
      width = props.width!
      height = props.height!
      // centerX and centerY already default to schX/schY or 0
    } else {
      // This should not happen due to validation, but we guard anyway
      return
    }

    const x = centerX - width / 2
    const y = centerY - height / 2

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
