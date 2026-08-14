import { symbolProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../../base-components/PrimitiveComponent"
import type { Port } from "../Port/Port"
import type { ISymbol, SchematicSymbolBounds } from "./ISymbol"
import { compose, translate, scale, type Matrix } from "transformation-matrix"
import { getBoundsForSchematic } from "lib/utils/autorouting/getBoundsForSchematic"
import { svgPathToPoints } from "lib/utils/schematic/svgPathToPoints"
import type {
  SchematicBoxDimensions,
  SchematicBoxPortPositionWithMetadata,
} from "lib/utils/schematic/getAllDimensionsForSchematicBox"

type SymbolEdge = "left" | "right" | "top" | "bottom"

type SymbolEdgePoint = {
  x: number
  y: number
  side: SymbolEdge
}

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

  /**
   * Imported symbols often contain the pin stems as open schematic paths while
   * their electrical ports are owned by the parent component. When every pin
   * can be matched to a unique path endpoint on the symbol boundary, use those
   * endpoints for the parent's schematic ports.
   */
  getInferredSchematicPortDimensions(
    pinCount: number,
  ): SchematicBoxDimensions | null {
    if (pinCount === 0) return null
    if (this.children.some((child) => child.componentName === "Port")) {
      return null
    }

    const subpaths: Array<Array<{ x: number; y: number }>> = []
    for (const child of this.children) {
      if (child.componentName !== "SchematicPath") continue

      const { points, svgPath } = child._parsedProps as {
        points?: Array<{ x: number; y: number }>
        svgPath?: string
      }
      if (points?.length) subpaths.push(points)
      if (svgPath) subpaths.push(...svgPathToPoints(svgPath))
    }

    const allPoints = subpaths.flat()
    if (allPoints.length === 0) return null

    const bounds = {
      minX: Math.min(...allPoints.map((point) => point.x)),
      maxX: Math.max(...allPoints.map((point) => point.x)),
      minY: Math.min(...allPoints.map((point) => point.y)),
      maxY: Math.max(...allPoints.map((point) => point.y)),
    }
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    const epsilon = Math.max(width, height, 1) * 1e-6
    const pointsAreEqual = (
      a: { x: number; y: number },
      b: { x: number; y: number },
    ) => Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon

    const classifyBoundaryPoint = (point: {
      x: number
      y: number
    }): SymbolEdgePoint | null => {
      if (Math.abs(point.x - bounds.minX) <= epsilon) {
        return { ...point, side: "left" }
      }
      if (Math.abs(point.x - bounds.maxX) <= epsilon) {
        return { ...point, side: "right" }
      }
      if (Math.abs(point.y - bounds.minY) <= epsilon) {
        return { ...point, side: "bottom" }
      }
      if (Math.abs(point.y - bounds.maxY) <= epsilon) {
        return { ...point, side: "top" }
      }
      return null
    }

    const boundaryEndpoints: SymbolEdgePoint[] = []
    for (const path of subpaths) {
      if (path.length < 2) continue
      const first = path[0]!
      const last = path[path.length - 1]!
      if (pointsAreEqual(first, last)) continue

      for (const endpoint of [first, last]) {
        const boundaryPoint = classifyBoundaryPoint(endpoint)
        if (!boundaryPoint) continue
        if (
          boundaryEndpoints.some(
            (candidate) =>
              candidate.side === boundaryPoint.side &&
              pointsAreEqual(candidate, boundaryPoint),
          )
        ) {
          continue
        }
        boundaryEndpoints.push(boundaryPoint)
      }
    }

    // Only infer when the geometry gives an unambiguous one-to-one mapping.
    if (boundaryEndpoints.length !== pinCount) return null

    const orderedEndpoints = [
      ...boundaryEndpoints
        .filter((point) => point.side === "left")
        .sort((a, b) => b.y - a.y),
      ...boundaryEndpoints
        .filter((point) => point.side === "bottom")
        .sort((a, b) => a.x - b.x),
      ...boundaryEndpoints
        .filter((point) => point.side === "right")
        .sort((a, b) => a.y - b.y),
      ...boundaryEndpoints
        .filter((point) => point.side === "top")
        .sort((a, b) => b.x - a.x),
    ]

    const targetWidth = this._parsedProps.width
    const targetHeight = this._parsedProps.height
    const scaleX =
      targetWidth !== undefined && width > 0 ? targetWidth / width : 1
    const scaleY =
      targetHeight !== undefined && height > 0 ? targetHeight / height : 1
    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    }
    const shouldCenterForResize =
      targetWidth !== undefined || targetHeight !== undefined
    const stemLength = 0.4
    const outwardDirectionBySide = {
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      top: { x: 0, y: 1 },
      bottom: { x: 0, y: -1 },
    } satisfies Record<SymbolEdge, { x: number; y: number }>

    const ports = orderedEndpoints.map((endpoint, index) => {
      const bodyConnectionPoint = shouldCenterForResize
        ? {
            x: (endpoint.x - center.x) * scaleX,
            y: (endpoint.y - center.y) * scaleY,
          }
        : endpoint
      const outwardDirection = outwardDirectionBySide[endpoint.side]
      return {
        x: bodyConnectionPoint.x + outwardDirection.x * stemLength,
        y: bodyConnectionPoint.y + outwardDirection.y * stemLength,
        side: endpoint.side,
        pinNumber: index + 1,
        trueIndex: index,
        distanceFromOrthogonalEdge: 0,
        stemLength,
      } satisfies SchematicBoxPortPositionWithMetadata
    })

    return {
      pinCount,
      getPortPositionByPinNumber(pinNumber) {
        return ports.find((port) => port.pinNumber === pinNumber) ?? null
      },
      getSize() {
        return {
          width: targetWidth ?? width,
          height: targetHeight ?? height,
        }
      },
      getSizeIncludingPins() {
        return this.getSize()
      },
    }
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
    const schematicElements: Array<{
      type: string
      [key: string]: any
    }> = []

    // Collect circuit-json elements from children, including ports so
    // the full symbol (body + stems) fits within the specified width/height
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
    const scaleX =
      targetWidth !== undefined && currentWidth > 0
        ? targetWidth / currentWidth
        : 1
    const scaleY =
      targetHeight !== undefined && currentHeight > 0
        ? targetHeight / currentHeight
        : 1

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
