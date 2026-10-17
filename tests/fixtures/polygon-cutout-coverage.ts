import Flatten from "@flatten-js/core"
import type { Point } from "@tscircuit/math-utils"

type Rect = { center: Point; width: number; height: number }

/**
 * Independent boolean coverage check in board world coordinates (mm, +X right,
 * +Y up). Snap to a 1 nm grid and expand obstacles by 1 nm to absorb floating
 * point reconstruction of rectangle corners, far below routing resolution.
 */
export const getUncoveredPolygonArea = (points: Point[], rects: Rect[]) => {
  const scale = 1e6
  let uncovered = new Flatten.Polygon(
    points.map(
      ({ x, y }) =>
        new Flatten.Point(Math.round(x * scale), Math.round(y * scale)),
    ),
  )
  if (uncovered.orientation() === Flatten.ORIENTATION.CW) uncovered.reverse()
  for (const { center, width, height } of rects) {
    const bounds = new Flatten.Box(
      Math.floor((center.x - width / 2) * scale) - 1,
      Math.floor((center.y - height / 2) * scale) - 1,
      Math.ceil((center.x + width / 2) * scale) + 1,
      Math.ceil((center.y + height / 2) * scale) + 1,
    )
    uncovered = Flatten.BooleanOperations.subtract(
      uncovered,
      new Flatten.Polygon(bounds),
    )
  }
  return uncovered.area() / scale ** 2
}

export const containsPoint = (rect: Rect, point: Point) =>
  Math.abs(point.x - rect.center.x) <= rect.width / 2 + 1e-9 &&
  Math.abs(point.y - rect.center.y) <= rect.height / 2 + 1e-9

/** SVG performs the board-world (+Y up) to screen (+Y down) transform. */
export const renderPolygonCutoutCoverage = ({
  points,
  rects,
  title,
  witness,
}: {
  points: Point[]
  rects: Rect[]
  title: string
  witness?: Point
}) => {
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const panels = [
    {
      label: "Full cutout",
      minX: minX - 1,
      maxX: maxX + 1,
      minY: minY - 1,
      maxY: maxY + 1,
    },
    ...(witness
      ? [
          {
            label: "Reported corner",
            minX: witness.x - 1.2,
            maxX: witness.x + 1.2,
            minY: witness.y - 1.2,
            maxY: witness.y + 1.2,
          },
        ]
      : []),
  ]
  const missingArea = getUncoveredPolygonArea(points, rects)
  const width = panels.length * 440
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="510" viewBox="0 0 ${width} 510">
  <rect width="100%" height="100%" fill="#101820"/>
  <g fill="#eef4f8" font-family="Arial,sans-serif"><text x="20" y="27" font-size="18">${title}</text>
  <text x="20" y="49" font-size="12">Blue: emitted obstacles · Orange: source boundary · Green: regression point</text></g>
  ${panels
    .map((panel, panelIndex) => {
      const scale = Math.min(
        400 / (panel.maxX - panel.minX),
        390 / (panel.maxY - panel.minY),
      )
      const x = panelIndex * 440 + 20,
        y = 80
      return `<defs><clipPath id="panel-${panelIndex}"><rect x="${x}" y="${y}" width="400" height="390"/></clipPath></defs>
    <text x="${x}" y="70" fill="#eef4f8" font-family="Arial,sans-serif" font-size="13">${panel.label}</text>
    <g clip-path="url(#panel-${panelIndex})"><g transform="translate(${x} ${y + 390}) scale(${scale} ${-scale}) translate(${-panel.minX} ${-panel.minY})">
    ${rects.map((rect) => `<rect x="${rect.center.x - rect.width / 2}" y="${rect.center.y - rect.height / 2}" width="${rect.width}" height="${rect.height}" fill="#398fd1" stroke="#83c5ee" stroke-width="${0.45 / scale}"/>`).join("")}
    <polygon points="${points.map((point) => `${point.x},${point.y}`).join(" ")}" fill="none" stroke="#ffae50" stroke-width="${2 / scale}"/>
    ${witness ? `<circle cx="${witness.x}" cy="${witness.y}" r="${4 / scale}" fill="#62f3a5"/>` : ""}
    </g></g>`
    })
    .join("")}
  <text x="20" y="495" fill="#eef4f8" font-family="Arial,sans-serif" font-size="12">${rects.length} rectangles · uncovered area: ${missingArea.toFixed(6)} mm²</text></svg>`
}
