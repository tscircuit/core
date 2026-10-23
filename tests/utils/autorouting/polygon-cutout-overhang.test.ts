import { expect, test } from "bun:test"
import Flatten from "@flatten-js/core"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { stackSvgsHorizontally } from "stack-svgs"
import { renderPolygonCutoutCoverage } from "tests/fixtures/polygon-cutout-coverage"
import { applyToPoint, rotateDEG } from "transformation-matrix"

test("polygon cutout outside overhang for diagonal, shallow and steep edges", () => {
  // Board-world points in mm (+X right, +Y up). The triangles are convex:
  // distance to a convex polygon is convex, so the maximum over a rectangle
  // occurs at a corner. This checks the whole rectangle, not sampled edges.
  const cases = [
    { name: "45 degree edge", width: 4, height: 4 },
    { name: "Shallow edge", width: 4, height: 0.4 },
    { name: "Steep edge", width: 0.4, height: 4 },
  ]
  const maximumOutsideDistance = 0.1
  const panels: string[] = []
  for (const { name, width, height } of cases) {
    for (const rotation of [0, 90, 180, 270]) {
      const points = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
      ].map((point) => applyToPoint(rotateDEG(rotation), point))
      const polygon = new Flatten.Polygon(
        points.map(({ x, y }) => new Flatten.Point(x, y)),
      )
      for (const ring of [
        points,
        points.toReversed(),
        [...points, points[0]!],
      ]) {
        const rectangles = getObstaclesFromCircuitJson([
          {
            type: "pcb_cutout",
            pcb_cutout_id: "sloped_cutout",
            shape: "polygon",
            points: ring,
          },
        ])
        let maximumOverhang = 0
        for (const rect of rectangles) {
          for (const dx of [-rect.width / 2, rect.width / 2]) {
            for (const dy of [-rect.height / 2, rect.height / 2]) {
              const corner = new Flatten.Point(
                rect.center.x + dx,
                rect.center.y + dy,
              )
              if (!polygon.contains(corner)) {
                maximumOverhang = Math.max(
                  maximumOverhang,
                  polygon.distanceTo(corner)[0],
                )
              }
            }
          }
        }
        expect(maximumOverhang).toBeLessThanOrEqual(
          maximumOutsideDistance + 1e-9,
        )
        if (rotation === 0 && ring === points) {
          panels.push(
            renderPolygonCutoutCoverage({
              points,
              rects: rectangles,
              title: `${name}: outside ${maximumOverhang.toFixed(4)} mm`,
            }),
          )
        }
      }
    }
  }
  expect(stackSvgsHorizontally(panels)).toMatchSvgSnapshot(import.meta.path)
})
