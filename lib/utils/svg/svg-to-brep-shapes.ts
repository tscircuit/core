import type { BRepShape } from "circuit-json"
import { XMLParser } from "fast-xml-parser"
import { svgPathToPoints } from "lib/utils/schematic/svgPathToPoints"
import {
  applyToPoint,
  compose,
  fromDefinition,
  fromTransformAttribute,
  identity,
  type Matrix,
} from "transformation-matrix"

type Point = { x: number; y: number }
type Polygon = Point[]
type XmlScalar = string | number | boolean | null | undefined
type XmlNodeValue = XmlScalar | XmlNode | Array<XmlScalar | XmlNode>
interface XmlNode {
  [key: string]: XmlNodeValue
}
type FillRule = "evenodd" | "nonzero"
type CollectedElement = {
  polygons: Polygon[]
  fillRule: FillRule
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: true,
  allowBooleanAttributes: true,
})

const ensureArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

const parseNumber = (value: XmlNodeValue, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const parseStyle = (style: XmlNodeValue): Record<string, string> => {
  if (typeof style !== "string") return {}

  const entries = style
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [key, ...valueParts] = entry.split(":")
      return [key?.trim() ?? "", valueParts.join(":").trim()] as const
    })
    .filter(([key, value]) => key && value)

  return Object.fromEntries(entries)
}

const getAttr = (
  node: XmlNode,
  name: string,
  style: Record<string, string>,
): string | undefined => {
  const attrValue = node[`@_${name}`]
  if (typeof attrValue === "string") return attrValue
  if (typeof attrValue === "number") return String(attrValue)
  return style[name]
}

const isZeroLike = (value: string | undefined) =>
  value !== undefined && Math.abs(parseNumber(value, Number.NaN)) < 1e-9

const isHiddenNode = (node: XmlNode): boolean => {
  const style = parseStyle(node["@_style"])
  const display = getAttr(node, "display", style)
  const visibility = getAttr(node, "visibility", style)
  const opacity = getAttr(node, "opacity", style)

  return (
    display === "none" ||
    visibility === "hidden" ||
    visibility === "collapse" ||
    isZeroLike(opacity)
  )
}

const hasVisibleFill = (node: XmlNode): boolean => {
  const style = parseStyle(node["@_style"])
  const fill = getAttr(node, "fill", style)
  const fillOpacity = getAttr(node, "fill-opacity", style)
  const opacity = getAttr(node, "opacity", style)

  if (fill === "none") return false
  if (isZeroLike(fillOpacity) || isZeroLike(opacity)) return false
  return true
}

const getFillRule = (node: XmlNode): FillRule => {
  const style = parseStyle(node["@_style"])
  const fillRule = getAttr(node, "fill-rule", style)?.toLowerCase()
  return fillRule === "evenodd" || fillRule === "even-odd"
    ? "evenodd"
    : "nonzero"
}

const parseTransform = (transformAttr: XmlNodeValue): Matrix => {
  if (typeof transformAttr !== "string" || transformAttr.trim() === "") {
    return identity()
  }

  const definitions = fromTransformAttribute(transformAttr)
  if (definitions.length === 0) return identity()

  return compose(...fromDefinition(definitions))
}

const dedupePolygon = (points: Polygon): Polygon => {
  const deduped: Polygon = []

  for (const point of points) {
    const previous = deduped[deduped.length - 1]
    if (
      !previous ||
      Math.abs(previous.x - point.x) > 1e-9 ||
      Math.abs(previous.y - point.y) > 1e-9
    ) {
      deduped.push(point)
    }
  }

  if (deduped.length > 1) {
    const first = deduped[0]!
    const last = deduped[deduped.length - 1]!
    if (
      Math.abs(first.x - last.x) < 1e-9 &&
      Math.abs(first.y - last.y) < 1e-9
    ) {
      deduped.pop()
    }
  }

  return deduped
}

const closePolygon = (points: Polygon): Polygon => {
  if (points.length < 2) return points
  const first = points[0]!
  const last = points[points.length - 1]!

  if (Math.abs(first.x - last.x) < 1e-9 && Math.abs(first.y - last.y) < 1e-9) {
    return dedupePolygon(points)
  }

  return dedupePolygon([...points, first])
}

const polygonArea = (points: Polygon): number => {
  if (points.length < 3) return 0

  let area = 0
  for (let i = 0; i < points.length; i++) {
    const current = points[i]!
    const next = points[(i + 1) % points.length]!
    area += current.x * next.y - next.x * current.y
  }
  return area / 2
}

const orientPolygon = (points: Polygon, clockwise: boolean): Polygon => {
  const area = polygonArea(points)
  if (area === 0) return points
  const isClockwise = area < 0
  return isClockwise === clockwise ? points : [...points].reverse()
}

const pointInPolygon = (point: Point, polygon: Polygon): boolean => {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!
    const b = polygon[j]!

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x

    if (intersects) inside = !inside
  }

  return inside
}

const getPolygonBounds = (polygons: Polygon[]) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const polygon of polygons) {
    for (const point of polygon) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
  }

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

const parsePointList = (value: XmlNodeValue): Polygon => {
  if (typeof value !== "string") return []

  const numbers = value
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part))
    .filter((num) => Number.isFinite(num))

  const points: Polygon = []
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    points.push({ x: numbers[i]!, y: numbers[i + 1]! })
  }

  return points
}

const rectToPath = (node: XmlNode): string => {
  const x = parseNumber(node["@_x"])
  const y = parseNumber(node["@_y"])
  const width = parseNumber(node["@_width"])
  const height = parseNumber(node["@_height"])
  let rx = parseNumber(node["@_rx"])
  let ry = parseNumber(node["@_ry"])

  if (rx === 0 && ry > 0) rx = ry
  if (ry === 0 && rx > 0) ry = rx

  rx = Math.max(0, Math.min(rx, width / 2))
  ry = Math.max(0, Math.min(ry, height / 2))

  if (rx === 0 && ry === 0) {
    return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`
  }

  return [
    `M ${x + rx} ${y}`,
    `H ${x + width - rx}`,
    `A ${rx} ${ry} 0 0 1 ${x + width} ${y + ry}`,
    `V ${y + height - ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + width - rx} ${y + height}`,
    `H ${x + rx}`,
    `A ${rx} ${ry} 0 0 1 ${x} ${y + height - ry}`,
    `V ${y + ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
    "Z",
  ].join(" ")
}

const circleToPath = (node: XmlNode): string => {
  const cx = parseNumber(node["@_cx"])
  const cy = parseNumber(node["@_cy"])
  const r = parseNumber(node["@_r"])

  return [
    `M ${cx + r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx - r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx + r} ${cy}`,
    "Z",
  ].join(" ")
}

const ellipseToPath = (node: XmlNode): string => {
  const cx = parseNumber(node["@_cx"])
  const cy = parseNumber(node["@_cy"])
  const rx = parseNumber(node["@_rx"])
  const ry = parseNumber(node["@_ry"])

  return [
    `M ${cx + rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`,
    "Z",
  ].join(" ")
}

const pathToPolygons = (path: string): Polygon[] =>
  svgPathToPoints(path)
    .map(closePolygon)
    .filter(
      (polygon) => polygon.length >= 3 && Math.abs(polygonArea(polygon)) > 1e-6,
    )

const getFilledPolygonsForTag = (tagName: string, node: XmlNode): Polygon[] => {
  if (isHiddenNode(node) || !hasVisibleFill(node)) return []

  if (tagName === "path" && typeof node["@_d"] === "string") {
    return pathToPolygons(node["@_d"])
  }

  if (tagName === "rect") {
    return pathToPolygons(rectToPath(node))
  }

  if (tagName === "circle") {
    return pathToPolygons(circleToPath(node))
  }

  if (tagName === "ellipse") {
    return pathToPolygons(ellipseToPath(node))
  }

  if (tagName === "polygon") {
    const polygon = closePolygon(parsePointList(node["@_points"]))
    return polygon.length >= 3 && Math.abs(polygonArea(polygon)) > 1e-6
      ? [polygon]
      : []
  }

  return []
}

const applyTransformToPolygon = (
  polygon: Polygon,
  transform: Matrix,
): Polygon => polygon.map((point) => applyToPoint(transform, point))

const collectElements = (
  tagName: string,
  node: XmlNode,
  inheritedTransform: Matrix,
  elements: CollectedElement[],
) => {
  const currentTransform = compose(
    inheritedTransform,
    parseTransform(node["@_transform"]),
  )

  const transformedPolygons = getFilledPolygonsForTag(tagName, node).map(
    (polygon) => applyTransformToPolygon(polygon, currentTransform),
  )
  if (transformedPolygons.length > 0) {
    elements.push({
      polygons: transformedPolygons,
      fillRule: getFillRule(node),
    })
  }

  for (const [childTagName, childValue] of Object.entries(node)) {
    if (childTagName.startsWith("@_") || childTagName === "#text") continue

    for (const child of ensureArray(childValue)) {
      if (child && typeof child === "object") {
        collectElements(
          childTagName,
          child as XmlNode,
          currentTransform,
          elements,
        )
      }
    }
  }
}

const parseViewBox = (
  root: XmlNode,
): { minX: number; minY: number; width: number; height: number } | null => {
  const viewBox = root["@_viewBox"]
  if (typeof viewBox === "string") {
    const numbers = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value))
      .filter((num) => Number.isFinite(num))
    if (numbers.length === 4 && numbers[2]! > 0 && numbers[3]! > 0) {
      return {
        minX: numbers[0]!,
        minY: numbers[1]!,
        width: numbers[2]!,
        height: numbers[3]!,
      }
    }
  }

  const width = parseNumber(root["@_width"], Number.NaN)
  const height = parseNumber(root["@_height"], Number.NaN)
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    return { minX: 0, minY: 0, width, height }
  }

  return null
}

type PolygonNode = {
  polygon: Polygon
  sign: number
  children: PolygonNode[]
}

const buildPolygonTree = (polygons: Polygon[]): PolygonNode[] => {
  const sortedPolygons = [...polygons].sort(
    (a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)),
  )

  const roots: PolygonNode[] = []

  const insertNode = (node: PolygonNode, candidates: PolygonNode[]) => {
    for (const candidate of candidates) {
      if (pointInPolygon(node.polygon[0]!, candidate.polygon)) {
        insertNode(node, candidate.children)
        return
      }
    }
    candidates.push(node)
  }

  for (const polygon of sortedPolygons) {
    insertNode(
      {
        polygon,
        sign: polygonArea(polygon) >= 0 ? 1 : -1,
        children: [],
      },
      roots,
    )
  }

  return roots
}

const polygonsToBrepShapesEvenOdd = (roots: PolygonNode[]): BRepShape[] => {
  const shapes: BRepShape[] = []

  const visitNode = (node: PolygonNode, depth: number) => {
    if (depth % 2 === 0) {
      shapes.push({
        outer_ring: {
          vertices: orientPolygon(node.polygon, false),
        },
        inner_rings: node.children.map((child) => ({
          vertices: orientPolygon(child.polygon, true),
        })),
      })
    }

    for (const child of node.children) {
      for (const grandchild of child.children) {
        visitNode(grandchild, depth + 2)
      }
    }
  }

  for (const node of roots) {
    visitNode(node, 0)
  }

  return shapes
}

const polygonsToBrepShapesNonZero = (roots: PolygonNode[]): BRepShape[] => {
  const shapes: BRepShape[] = []

  const visitNode = (node: PolygonNode, parentWinding: number) => {
    const winding = parentWinding + node.sign

    if (parentWinding === 0 && winding !== 0) {
      shapes.push({
        outer_ring: {
          vertices: orientPolygon(node.polygon, false),
        },
        inner_rings: node.children
          .filter((child) => winding + child.sign === 0)
          .map((child) => ({
            vertices: orientPolygon(child.polygon, true),
          })),
      })
    }

    for (const child of node.children) {
      visitNode(child, winding)
    }
  }

  for (const node of roots) {
    visitNode(node, 0)
  }

  return shapes
}

const polygonsToBrepShapes = (
  polygons: Polygon[],
  fillRule: FillRule,
): BRepShape[] => {
  const roots = buildPolygonTree(polygons)
  return fillRule === "evenodd"
    ? polygonsToBrepShapesEvenOdd(roots)
    : polygonsToBrepShapesNonZero(roots)
}

export const svgToBrepShapes = (
  svgContent: string,
  {
    width,
    height,
  }: {
    width: number
    height: number
  },
): BRepShape[] => {
  const parsed = xmlParser.parse(svgContent) as { svg?: XmlNode }
  const root = parsed.svg

  if (!root) {
    throw new Error("Silkscreen graphic loader expected an SVG document")
  }

  const collectedElements: CollectedElement[] = []
  collectElements("svg", root, identity(), collectedElements)

  const sourcePolygons = collectedElements.flatMap(
    (element) => element.polygons,
  )

  if (sourcePolygons.length === 0) {
    throw new Error("SVG does not contain any filled geometry to convert")
  }

  const sourceBounds = parseViewBox(root) ?? getPolygonBounds(sourcePolygons)
  if (sourceBounds.width <= 0 || sourceBounds.height <= 0) {
    throw new Error("SVG has invalid bounds for silkscreen conversion")
  }

  const centerX = sourceBounds.minX + sourceBounds.width / 2
  const centerY = sourceBounds.minY + sourceBounds.height / 2
  const scaleX = width / sourceBounds.width
  const scaleY = height / sourceBounds.height

  return collectedElements.flatMap((element) =>
    polygonsToBrepShapes(
      element.polygons
        .map((polygon) =>
          polygon.map((point) => ({
            x: (point.x - centerX) * scaleX,
            y: (centerY - point.y) * scaleY,
          })),
        )
        .map(closePolygon)
        .filter(
          (polygon) =>
            polygon.length >= 3 && Math.abs(polygonArea(polygon)) > 1e-6,
        ),
      element.fillRule,
    ),
  )
}
