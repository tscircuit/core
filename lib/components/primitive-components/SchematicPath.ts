import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { schematicPathProps } from "@tscircuit/props"
import { svgPathToPoints } from "lib/utils/schematic/svgPathToPoints"
import { applyToPoint } from "transformation-matrix"

export class SchematicPath extends PrimitiveComponent<
  typeof schematicPathProps
> {
  isSchematicPrimitive = true

  schematic_path_ids: string[] = []

  get config() {
    return {
      componentName: "SchematicPath",
      zodProps: schematicPathProps,
    }
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const globalPos = this._getGlobalSchematicPositionBeforeLayout()

    const schematic_component_id =
      this.getPrimitiveContainer()?.parent?.schematic_component_id!

    const schematic_symbol_id = this._getSymbolAncestor()?.schematic_symbol_id

    const subcircuit_id = this.getSubcircuit().subcircuit_id ?? undefined

    this.schematic_path_ids = []

    // If svgPath is provided, parse it and create separate paths for each subpath
    if (props.svgPath) {
      const subpaths = svgPathToPoints(props.svgPath)

      for (const subpathPoints of subpaths) {
        const schematic_path = db.schematic_path.insert({
          schematic_component_id,
          schematic_symbol_id,
          points: subpathPoints.map((point) => ({
            x: point.x + globalPos.x,
            y: point.y + globalPos.y,
          })),
          is_filled: props.isFilled,
          fill_color: props.fillColor as any,
          stroke_color: props.strokeColor,
          stroke_width: props.strokeWidth,
          subcircuit_id,
        })
        this.schematic_path_ids.push(schematic_path.schematic_path_id)
      }
    } else if (props.points && props.points.length > 0) {
      // Use the provided points directly
      const schematic_path = db.schematic_path.insert({
        schematic_component_id,
        schematic_symbol_id,
        points: props.points.map((point) => ({
          x: point.x + globalPos.x,
          y: point.y + globalPos.y,
        })),
        is_filled: props.isFilled,
        fill_color: props.fillColor as any,
        stroke_color: props.strokeColor,
        stroke_width: props.strokeWidth,
        subcircuit_id,
      })
      this.schematic_path_ids.push(schematic_path.schematic_path_id)
    }
  }

  doInitialSchematicSymbolResize(): void {
    if (this.root?.schematicDisabled) return
    if (this.schematic_path_ids.length === 0) return

    const symbol = this._getSymbolAncestor()
    const transform = symbol?.getUserCoordinateToResizedSymbolTransform()
    if (!transform) return

    const { db } = this.root!

    for (const pathId of this.schematic_path_ids) {
      const path = db.schematic_path.get(pathId)
      if (!path) continue

      const newPoints = path.points.map((point) => {
        const transformed = applyToPoint(transform, point)
        return { x: transformed.x, y: transformed.y }
      })

      db.schematic_path.update(pathId, {
        points: newPoints,
      })
    }
  }
}
