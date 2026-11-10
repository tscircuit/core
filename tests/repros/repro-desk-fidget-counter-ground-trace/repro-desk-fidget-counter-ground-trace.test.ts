import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { markTraceSegmentsInsideCopperPour } from "lib/components/primitive-components/CopperPour/utils/mark-trace-segments-inside-copper-pour"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

/**
 * Fixture coordinates are unchanged board-world points in mm: +X right, +Y up,
 * +Z above the PCB (right handed). Pours are hidden only in the rendered copy,
 * after core has classified all trace segments against the actual pour geometry.
 */
test("desk fidget counter ground continuation with copper pours hidden", async () => {
  const circuitJson: AnyCircuitElement[] = JSON.parse(
    readFileSync(
      new URL("./desk-fidget-counter.fixture.json", import.meta.url),
      "utf8",
    ),
  )
  const originalCopper = structuredClone(circuitJson)
  const db = su(circuitJson)
  for (const copperPour of db.pcb_copper_pour.list()) {
    markTraceSegmentsInsideCopperPour({ db, copperPour })
  }

  const continuation = db.pcb_trace.get("pcb_trace_external_236")!
  const diagonal = db.pcb_trace.get("pcb_trace_external_235")!
  // The reported apparent break is an exact same-layer junction, not an open.
  expect(continuation.route[1]).toMatchObject({
    x: 17.4804,
    y: 27.1958,
    layer: "top",
  })
  expect(diagonal.route[0]).toMatchObject({
    x: 17.4804,
    y: 27.1958,
    layer: "top",
  })

  const withoutVisibility = (copper: AnyCircuitElement[]) =>
    copper.map((element) => {
      if (element.type !== "pcb_trace") return element
      return {
        ...element,
        route: element.route.map((routePoint) => {
          if (
            routePoint.route_type !== "wire" &&
            routePoint.route_type !== "via"
          )
            return routePoint
          const {
            is_inside_copper_pour,
            copper_pour_id,
            ...physicalRoutePoint
          } = routePoint
          return physicalRoutePoint
        }),
      }
    })
  expect(withoutVisibility(db.toArray())).toEqual(
    withoutVisibility(originalCopper),
  )

  const tracesWithoutPourFills = db
    .toArray()
    .filter((element) => element.type !== "pcb_copper_pour")
  const fullBoard = convertCircuitJsonToPcbSvg(tracesWithoutPourFills, {
    layer: "top",
    width: 720,
    height: 860,
    includeVersion: false,
  })
  const detail = convertCircuitJsonToPcbSvg(tracesWithoutPourFills, {
    layer: "top",
    width: 720,
    height: 720,
    includeVersion: false,
    viewport: { minX: 6, maxX: 19, minY: 23, maxY: 36 },
  })
  const caption = (title: string, description: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="100" viewBox="0 0 720 100">
      <rect width="720" height="100" fill="#172131" />
      <text x="20" y="36" fill="white" font-family="Arial" font-size="24">${title}</text>
      <text x="20" y="72" fill="#cbd5e1" font-family="Arial" font-size="17">${description}</text>
    </svg>`
  // Preserve each renderer viewport when stack-svgs unwraps its outer SVG.
  const clippedViewport = (svg: string, height: number) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}">${svg.replace("<svg ", '<svg overflow="hidden" ')}</svg>`
  const overview = stackSvgsVertically(
    [
      caption(
        "Desk fidget counter / RP2040",
        "Actual v6.0.3 copper; no rerouting",
      ),
      clippedViewport(fullBoard, 860),
    ],
    { gap: 0, normalizeSize: false },
  )
  const continuationVisible = !continuation.route.every(
    (point) => point.route_type === "wire" && point.is_inside_copper_pour,
  )
  const closeup = stackSvgsVertically(
    [
      caption(
        "C1 GND / pours hidden",
        continuationVisible
          ? "Continuation visible; copper unchanged"
          : "BUG: 13.0963 mm continuation hidden",
      ),
      clippedViewport(detail, 720),
      caption(
        "Trace crosses a 0.500697 mm pour gap",
        "Missed at Y=24.249652 to Y=24.750348",
      ),
    ],
    { gap: 0, normalizeSize: false },
  )

  await expect(
    stackSvgsHorizontally([overview, closeup], {
      gap: 16,
      normalizeSize: false,
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
