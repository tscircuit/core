import { schematicBoxProps } from "@tscircuit/props"
import type { SchematicBox as SchematicBoxCircuitJson } from "circuit-json"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Port } from "../Port"
import { getTitleAnchorAndPosition } from "../getTitleAnchorAndPosition"
import { SchematicBox_doInitialSchematicComponentRender } from "./SchematicBox_doInitialSchematicComponentRender"

export class SchematicBox extends PrimitiveComponent<typeof schematicBoxProps> {
  isSchematicPrimitive = true
  private _insertedSchematicBox?: SchematicBoxCircuitJson
  schematic_title_text_id?: string

  get config() {
    return {
      componentName: "SchematicBox",
      zodProps: schematicBoxProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSchematicComponentRender(): void {
    SchematicBox_doInitialSchematicComponentRender(this)
  }

  private _computeBoxAndTitleGeometry(): {
    width: number
    height: number
    x: number
    y: number
    title?: {
      anchor: ReturnType<typeof getTitleAnchorAndPosition>["textAnchor"]
      position: { x: number; y: number }
    }
  } | null {
    const { _parsedProps: props } = this
    if (props.chipRef) return null

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

      if (portsWithPosition.length === 0) return null

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
    } else if (hasFixedSize) {
      width = props.width!
      height = props.height!
      const center = this._getGlobalSchematicPositionBeforeLayout()
      x = center.x - width / 2
      y = center.y - height / 2
    } else {
      return null
    }

    if (!props.title) {
      return { width, height, x, y }
    }

    const isInside = props.titleInside
    const TITLE_PADDING = 0.1
    const anchor = props.titleAlignment
    const anchorPos = getTitleAnchorAndPosition({
      anchor,
      x,
      y,
      width,
      height,
      isInside,
    })
    let titleOffsetY: number
    let titleOffsetX: number
    const textAnchor = anchorPos.textAnchor
    if (isInside) {
      titleOffsetY = anchor.includes("top")
        ? -TITLE_PADDING
        : anchor.includes("bottom")
          ? TITLE_PADDING
          : 0
      titleOffsetX = anchor.includes("left")
        ? TITLE_PADDING
        : anchor.includes("right")
          ? -TITLE_PADDING
          : 0
    } else {
      titleOffsetY = anchor.includes("top")
        ? TITLE_PADDING
        : anchor.includes("bottom")
          ? -TITLE_PADDING
          : 0
      titleOffsetX = anchor.includes("center_left")
        ? -TITLE_PADDING
        : anchor.includes("center_right")
          ? TITLE_PADDING
          : 0
    }

    return {
      width,
      height,
      x,
      y,
      title: {
        anchor: textAnchor,
        position: {
          x: anchorPos.x + titleOffsetX,
          y: anchorPos.y + titleOffsetY,
        },
      },
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const geom = this._computeBoxAndTitleGeometry()
    if (!geom) return

    const schematicSheetId = this._resolveSchematicSheetId()
    this._insertedSchematicBox = db.schematic_box.insert({
      height: geom.height,
      width: geom.width,
      x: geom.x,
      y: geom.y,
      is_dashed: props.strokeStyle === "dashed",
      schematic_sheet_id: schematicSheetId,
    })

    if (props.title && geom.title) {
      const insertedText = db.schematic_text.insert({
        anchor: geom.title.anchor,
        text: props.title,
        font_size: props.titleFontSize ?? 0.18,
        color: props.titleColor ?? "#000000",
        position: geom.title.position,
        rotation: 0,
        schematic_sheet_id: schematicSheetId,
      })
      this.schematic_title_text_id = insertedText.schematic_text_id
    }
  }

  doInitialSchematicSectionRender(): void {
    if (this.root?.schematicDisabled) return
    const { _parsedProps: props } = this
    if (
      !props.overlay ||
      props.overlay.length === 0 ||
      !this._insertedSchematicBox
    )
      return

    const geom = this._computeBoxAndTitleGeometry()
    if (!geom) return

    this._insertedSchematicBox.height = geom.height
    this._insertedSchematicBox.width = geom.width
    this._insertedSchematicBox.x = geom.x
    this._insertedSchematicBox.y = geom.y

    if (this.schematic_title_text_id && geom.title) {
      const { db } = this.root!
      db.schematic_text.update(this.schematic_title_text_id, {
        anchor: geom.title.anchor,
        position: geom.title.position,
      })
    }
  }
}
