import { symbolProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Port } from "../Port/Port"
import type { ISymbol, SchematicSymbolBounds } from "./ISymbol"
import { compose, translate, scale, type Matrix } from "transformation-matrix"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"

export class SymbolComponent
  extends PrimitiveComponent<typeof symbolProps>
  implements ISymbol
{
  isPrimitiveContainer = true

  schematic_symbol_id?: string
  userCoordinateToResizedSymbolTransformMat?: Matrix
  schematicSymbolBoundsInUserCoordinates?: SchematicSymbolBounds

  get config() {
    return {
      componentName: "Symbol",
      zodProps: symbolProps,
    }
  }

  hasExplicitSize(): boolean {
    const { _parsedProps: props } = this
    return props.width !== undefined || props.height !== undefined
  }

  /**
   * Create the schematic_symbol element in SymbolContainerRender phase.
   * This runs before SchematicPrimitiveRender, ensuring children can
   * reference the schematic_symbol_id when they render.
   */
  doInitialSymbolContainerRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!

    const { _parsedProps: props } = this

    const parentNormal = this.getParentNormalComponent()
    const kicadSymbolMetadata = parentNormal?._parsedProps?.kicadSymbolMetadata

    const schematic_symbol = db.schematic_symbol.insert({
      name: props.name,
      metadata: kicadSymbolMetadata
        ? { kicad_symbol: kicadSymbolMetadata }
        : undefined,
    })

    this.schematic_symbol_id = schematic_symbol.schematic_symbol_id
  }

  getSchematicSymbolBounds(): SchematicSymbolBounds | null {
    if (this.schematicSymbolBoundsInUserCoordinates) {
      return this.schematicSymbolBoundsInUserCoordinates
    }

    // Compute bounds from children's circuit-json elements
    this._computeSchematicSymbolBounds()
    return this.schematicSymbolBoundsInUserCoordinates ?? null
  }

  getUserCoordinateToResizedSymbolTransform(): Matrix | null {
    if (!this.hasExplicitSize()) {
      return null
    }

    if (this.userCoordinateToResizedSymbolTransformMat) {
      return this.userCoordinateToResizedSymbolTransformMat
    }

    // Compute the transform
    this._computeUserCoordinateToResizedSymbolTransform()
    return this.userCoordinateToResizedSymbolTransformMat ?? null
  }

  private _computeSchematicSymbolBounds(): void {
    if (this.root?.schematicDisabled) return

    const { db } = this.root!
    const { viewbox } = this._parsedProps
    if (viewbox) {
      // viewbox is symbol-local (+X right, +Y up, mm). Children are emitted
      // in schematic world coordinates before resizing, so translate its
      // corner points by the same symbol position before deriving the transform.
      const globalPos = this._getGlobalSchematicPositionBeforeLayout()
      this.schematicSymbolBoundsInUserCoordinates = {
        minX: globalPos.x + viewbox.x,
        maxX: globalPos.x + viewbox.x + viewbox.width,
        minY: globalPos.y + viewbox.y,
        maxY: globalPos.y + viewbox.y + viewbox.height,
      }
      return
    }

    const schematicElements: Array<{
      type: string
      [key: string]: any
    }> = []

    // Automatic sizing includes both artwork and port stems by default.
    for (const child of this.children) {
      if (child.componentName === "Port") {
        const portId = (child as Port).schematic_port_id
        if (portId) {
          const port = db.schematic_port.get(portId)
          if (port) schematicElements.push(port)
        }
        continue
      }

      if (!child.isSchematicPrimitive) continue

      if (child.componentName === "SchematicLine") {
        const line = db.schematic_line.get((child as any).schematic_line_id)
        if (line) schematicElements.push(line)
      } else if (child.componentName === "SchematicRect") {
        const rect = db.schematic_rect.get((child as any).schematic_rect_id)
        if (rect) schematicElements.push(rect)
      } else if (child.componentName === "SchematicCircle") {
        const circle = db.schematic_circle.get(
          (child as any).schematic_circle_id,
        )
        if (circle) schematicElements.push(circle)
      } else if (child.componentName === "SchematicArc") {
        const arc = db.schematic_arc.get((child as any).schematic_arc_id)
        if (arc) schematicElements.push(arc)
      } else if (child.componentName === "SchematicText") {
        const text = db.schematic_text.get((child as any).schematic_text_id)
        if (text) schematicElements.push(text)
      } else if (child.componentName === "SchematicPath") {
        const pathIds = (child as any).schematic_path_ids as string[]
        if (pathIds) {
          for (const pathId of pathIds) {
            const path = db.schematic_path.get(pathId)
            if (path) schematicElements.push(path)
          }
        }
      }
    }

    if (schematicElements.length === 0) return

    const bounds = getBoundsForSchematic(schematicElements)
    this.schematicSymbolBoundsInUserCoordinates = bounds
  }

  private _computeUserCoordinateToResizedSymbolTransform(): void {
    const bounds = this.getSchematicSymbolBounds()
    if (!bounds) return

    const { _parsedProps: props } = this
    const targetWidth = props.width
    const targetHeight = props.height

    if (targetWidth === undefined && targetHeight === undefined) return

    const currentWidth = bounds.maxX - bounds.minX
    const currentHeight = bounds.maxY - bounds.minY

    if (currentWidth === 0 && currentHeight === 0) return

    // Calculate the current center of the content
    const currentCenterX = (bounds.minX + bounds.maxX) / 2
    const currentCenterY = (bounds.minY + bounds.maxY) / 2

    // Calculate scale factors
    let scaleX =
      targetWidth !== undefined && currentWidth > 0
        ? targetWidth / currentWidth
        : 1
    let scaleY =
      targetHeight !== undefined && currentHeight > 0
        ? targetHeight / currentHeight
        : 1

    if (props.fit === "contain") {
      // Bounds and drawing points are in schematic world space (+X right,
      // +Y up, mm). Use only constrained, nondegenerate axes for a uniform fit.
      const constrainedScales = []
      if (targetWidth !== undefined && currentWidth > 0) {
        constrainedScales.push(targetWidth / currentWidth)
      }
      if (targetHeight !== undefined && currentHeight > 0) {
        constrainedScales.push(targetHeight / currentHeight)
      }
      const uniformScale = constrainedScales.length
        ? Math.min(...constrainedScales)
        : 1
      scaleX = uniformScale
      scaleY = uniformScale
    }

    // Get the global position for the Symbol (where the content should be centered)
    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    // Build transformation matrix:
    // 1. Translate content center to origin
    // 2. Scale
    // 3. Translate to global position
    this.userCoordinateToResizedSymbolTransformMat = compose(
      translate(globalPos.x, globalPos.y),
      scale(scaleX, scaleY),
      translate(-currentCenterX, -currentCenterY),
    )
  }
}
