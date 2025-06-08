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

    let width: number
    let height: number
    let x: number
    let y: number
    let centerX: number
    let centerY: number

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
        position: port._getGlobalSchematicPositionAfterLayout(),
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

      const finalPaddingLeft = paddingLeft + defaultHorizontalPadding / 2
      const finalPaddingRight = paddingRight + defaultHorizontalPadding / 2
      const finalPaddingTop = paddingTop + defaultVerticalPadding / 2
      const finalPaddingBottom = paddingBottom + defaultVerticalPadding / 2

      const left = minX - finalPaddingLeft
      const right = maxX + finalPaddingRight
      const top = minY - finalPaddingBottom
      const bottom = maxY + finalPaddingTop

      width = right - left
      height = bottom - top
      x = left + (props.schX ?? 0)
      y = top + (props.schY ?? 0)
      centerX = x + width / 2
      centerY = y + height / 2
    } else if (hasFixedSize) {
      width = props.width!
      height = props.height!
      centerX = typeof props.schX === "number" ? props.schX : 0
      centerY = typeof props.schY === "number" ? props.schY : 0
      x = centerX - width / 2
      y = centerY - height / 2
    } else {
      return
    }

    db.schematic_box.insert({
      height,
      width,
      x,
      y,
      is_dashed: props.strokeStyle === "dashed",
      schematic_component_id: "",
    })

    if (props.title) {
      const isInside = props.titleInside ?? false

      const getAnchorPosition = (
        anchor: string,
      ): {
        x: number
        y: number
        textAnchor:
          | "center"
          | "top_left"
          | "top_center"
          | "top_right"
          | "center_left"
          | "center"
          | "center_right"
          | "bottom_left"
          | "bottom_center"
          | "bottom_right"
      } => {
        switch (anchor) {
          case "top_left":
            return {
              x: x,
              y: y + height,
              textAnchor: isInside ? "top_left" : "bottom_right",
            }
          case "top_center":
            return {
              x: x + width / 2,
              y: y + height,
              textAnchor: isInside ? "top_center" : "bottom_center",
            }
          case "top_right":
            return {
              x: x + width,
              y: y + height,
              textAnchor: isInside ? "top_right" : "bottom_left",
            }
          case "center_left":
            return {
              x: x,
              y: y + height / 2,
              textAnchor: isInside ? "center_left" : "center_right",
            }
          case "center":
            return { x: x + width / 2, y: y + height / 2, textAnchor: "center" }
          case "center_right":
            return {
              x: x + width,
              y: y + height / 2,
              textAnchor: isInside ? "center_right" : "center_left",
            }
          case "bottom_left":
            return {
              x: x,
              y: y,
              textAnchor: isInside ? "bottom_left" : "top_right",
            }
          case "bottom_center":
            return {
              x: x + width / 2,
              y: y,
              textAnchor: isInside ? "bottom_center" : "top_center",
            }
          case "bottom_right":
            return {
              x: x + width,
              y: y,
              textAnchor: isInside ? "bottom_right" : "top_left",
            }
          default:
            return { x: x + width / 2, y: y + height, textAnchor: "center" } // fallback: bottom-center
        }
      }

      const anchor = props.titleAnchorAlignment ?? "bottom_center"
      const anchorPos = getAnchorPosition(anchor)
      let titleOffsetY: number
      let titleOffsetX: number
      const textAnchor = anchorPos.textAnchor
      if (isInside) {
        titleOffsetY = anchor.includes("top")
          ? -0.15
          : anchor.includes("bottom")
            ? 0.15
            : 0
        titleOffsetX = anchor.includes("left")
          ? 0.15
          : anchor.includes("right")
            ? -0.15
            : 0
      } else {
        titleOffsetY = anchor.includes("top")
          ? 0.15
          : anchor.includes("bottom")
            ? -0.15
            : 0
        titleOffsetX = anchor.includes("left")
          ? -0.15
          : anchor.includes("right")
            ? 0.15
            : 0
      }

      const titleX = anchorPos.x + titleOffsetX
      const titleY = anchorPos.y + titleOffsetY

      db.schematic_text.insert({
        anchor: textAnchor,
        text: props.title,
        font_size: props.titleFontSize ?? 0.18,
        color: props.titleColor ?? "#000000",
        position: {
          x: titleX,
          y: titleY,
        },
        rotation: 0,
      })
    }
  }
}
