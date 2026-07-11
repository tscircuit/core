import type { AnyCircuitElement } from "circuit-json"
import { getBoundsForSchematic } from "../autorouting/getBoundsForSchematic"

type Point = {
  x: number
  y: number
}

type TranslatableSchematicElement = Extract<
  AnyCircuitElement,
  {
    type:
      | "schematic_component"
      | "schematic_port"
      | "schematic_line"
      | "schematic_rect"
      | "schematic_circle"
      | "schematic_arc"
      | "schematic_text"
      | "schematic_path"
  }
>

const isFinitePoint = (point: Point | null | undefined): point is Point =>
  typeof point?.x === "number" &&
  Number.isFinite(point.x) &&
  typeof point.y === "number" &&
  Number.isFinite(point.y)

const translatePoint = (point: Point, origin: Point): Point => ({
  x: point.x - origin.x,
  y: point.y - origin.y,
})

const isTranslatableSchematicElement = (
  element: AnyCircuitElement,
): element is TranslatableSchematicElement =>
  element.type === "schematic_component" ||
  element.type === "schematic_port" ||
  element.type === "schematic_line" ||
  element.type === "schematic_rect" ||
  element.type === "schematic_circle" ||
  element.type === "schematic_arc" ||
  element.type === "schematic_text" ||
  element.type === "schematic_path"

const getNormalizationOrigin = (
  symbolCircuitJson: readonly AnyCircuitElement[],
): Point | null => {
  const primarySchematicComponent = symbolCircuitJson.find(
    (
      element,
    ): element is Extract<AnyCircuitElement, { type: "schematic_component" }> =>
      element.type === "schematic_component" && isFinitePoint(element.center),
  )

  if (primarySchematicComponent) {
    return primarySchematicComponent.center
  }

  const schematicElements = symbolCircuitJson.filter(
    isTranslatableSchematicElement,
  )
  if (schematicElements.length === 0) return null

  const bounds = getBoundsForSchematic(schematicElements)
  if (
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxY)
  ) {
    return null
  }

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
}

const translateSchematicElement = (
  element: AnyCircuitElement,
  origin: Point,
): AnyCircuitElement => {
  switch (element.type) {
    case "schematic_component":
    case "schematic_port":
    case "schematic_rect":
    case "schematic_circle":
    case "schematic_arc":
      return isFinitePoint(element.center)
        ? {
            ...element,
            center: translatePoint(element.center, origin),
          }
        : element

    case "schematic_line":
      return {
        ...element,
        x1: element.x1 - origin.x,
        y1: element.y1 - origin.y,
        x2: element.x2 - origin.x,
        y2: element.y2 - origin.y,
      }

    case "schematic_text":
      return isFinitePoint(element.position)
        ? {
            ...element,
            position: translatePoint(element.position, origin),
          }
        : element

    case "schematic_path":
      return {
        ...element,
        points: element.points.map((point) => translatePoint(point, origin)),
      }

    default:
      return element
  }
}

export const normalizeSchematicSymbolCircuitJson = (
  symbolCircuitJson: readonly AnyCircuitElement[],
): AnyCircuitElement[] => {
  const origin = getNormalizationOrigin(symbolCircuitJson)
  if (!origin) return [...symbolCircuitJson]

  if (origin.x === 0 && origin.y === 0) {
    return [...symbolCircuitJson]
  }

  return symbolCircuitJson.map((element) =>
    translateSchematicElement(element, origin),
  )
}
