import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import {
  convertSrjToGraphicsObject,
  type SimpleRouteJson as AutorouterSimpleRouteJson,
} from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { withFixedTraces } from "lib/utils/autorouting/with-fixed-traces"

/** Render the full board input, cropping only the SVG view. Coordinates are
 * board-world points in mm, +X right, +Y up, +Z above (right-handed). */
function renderBypassView(input: SimpleRouteJson, title: string): string {
  const graphics = convertSrjToGraphicsObject(
    input as AutorouterSimpleRouteJson,
  )
  graphics.points = []
  graphics.rects!.push({
    center: { x: 1.9, y: 5.1 },
    width: 2.6,
    height: 3,
    fill: "none",
    stroke: "none",
    label: "bypass-viewport",
  })
  const svg = getSvgFromGraphicsObject(graphics, {
    backgroundColor: "white",
    includeTextLabels: false,
    // Keep coordinate rounding below 0.001 mm when cropping a few millimeters
    // from the full 144.5 mm board. The displayed viewport remains 1000x600.
    svgWidth: 100000,
    svgHeight: 60000,
  })
  const frame = svg.match(/<rect\b[^>]*data-label="bypass-viewport"[^>]*\/>/)
  if (!frame) throw new Error("Missing bypass viewport")
  const viewBox = ["x", "y", "width", "height"].map((attribute) => {
    const match = frame[0].match(new RegExp(`\\s${attribute}="([^"]+)"`))
    if (!match) throw new Error(`Missing viewport ${attribute}`)
    return Number(match[1])
  })
  const cropped = svg.replace(
    /<svg\b[^>]*>/,
    `<svg x="0" y="80" width="1000" height="600" viewBox="${viewBox.join(" ")}" overflow="hidden" xmlns="http://www.w3.org/2000/svg">`,
  )
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="680" viewBox="0 0 1000 680"><rect width="100%" height="100%" fill="white"/><text x="24" y="30" font-family="sans-serif" font-size="22">${title}</text><text x="24" y="59" font-family="sans-serif" font-size="16">RVboy native phase 9: full board input, view cropped around the bypass escapes</text>${cropped}</svg>`
}

test("RVboy fixed native phase copper stays exact instead of adding 205 obstacle rectangles", async () => {
  const fixture = JSON.parse(
    gunzipSync(
      readFileSync(
        new URL(
          "../../fixtures/rvboy-native-fixed-phase.json.gz",
          import.meta.url,
        ),
      ),
    ).toString(),
  ) as {
    input: SimpleRouteJson
    fixedTraceIds: Array<SimplifiedPcbTrace["pcb_trace_id"]>
    rasterizedInput: SimpleRouteJson
  }
  const original = structuredClone(fixture.input)
  const fixedIds = new Set(fixture.fixedTraceIds)
  const before = withFixedTraces(fixture.input, fixedIds, "obstacles")
  expect(before).toEqual(fixture.rasterizedInput)
  const after = withFixedTraces(fixture.input, fixedIds, "traces")
  expect(after.obstacles).toEqual(original.obstacles)
  expect(after.obstacles).toHaveLength(1019)
  expect(before.obstacles.length - after.obstacles.length).toBe(205)
  expect(after.traces).toHaveLength(9)
  expect(after.traces!.filter((trace) => trace.isFixed)).toHaveLength(8)
  expect(after.traces!.map((trace) => trace.route)).toEqual(
    original.traces!.map((trace) => trace.route),
  )
  expect(fixture.input).toEqual(original)
  await expect(
    renderBypassView(
      before,
      "Before: completed copper becomes obstacle rectangles",
    ),
  ).toMatchSvgSnapshot(import.meta.path, "rvboy-fixed-phase-before")
  await expect(
    renderBypassView(
      after,
      "After: exact polylines remain fixed in the native router",
    ),
  ).toMatchSvgSnapshot(import.meta.path, "rvboy-fixed-phase-after")
})
