import { expect, test } from "bun:test"
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { getSvgFromGraphicsObject, type GraphicsObject } from "graphics-debug"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { stackSvgsHorizontally } from "stack-svgs"
import fixture from "tests/fixtures/rvboy-via-escape-reversal.json"
import "tests/fixtures/extend-expect-any-svg"

test("reversing RVboy's ground escape preserves its clearance beside KEY_X", () => {
  // Exact full routes from the native RVboy phase, in board-world mm (+X right,
  // +Y up). Only the viewport is cropped; no routing coordinates are edited.
  const ground = fixture.ground as PcbTrace
  const original = structuredClone(ground.route)
  const reversed = { ...ground, route: reversePcbTraceRoute(ground.route) }
  const before = [
    fixture.signal,
    fixture.importedGroundBeforeFix,
    fixture.via,
  ] as AnyCircuitElement[]
  const after = [fixture.signal, reversed, fixture.via] as AnyCircuitElement[]
  expect(checkEachPcbTraceNonOverlapping(before)).toHaveLength(1)
  expect(checkEachPcbTraceNonOverlapping(after)).toHaveLength(0)
  expect(ground.route).toEqual(original)
  expect(reversed.route.at(-2)).toMatchObject({
    route_type: "wire",
    width: 0.45,
  })

  const render = (copper: AnyCircuitElement[], label: string): string => {
    const graphics: GraphicsObject = { lines: [], circles: [], rects: [] }
    // Draw the same segment capsules used by copper DRC, including coincident
    // wire/via points. The PCB viewer omits those zero-length segments.
    for (const trace of copper.filter(
      (e): e is PcbTrace => e.type === "pcb_trace",
    )) {
      for (let i = 1; i < trace.route.length; i++) {
        const a = trace.route[i - 1]!,
          b = trace.route[i]!
        if (
          (a.route_type !== "wire" && a.route_type !== "via") ||
          (b.route_type !== "wire" && b.route_type !== "via")
        )
          continue
        const wire = a.route_type === "wire" ? a : b
        if (
          wire.route_type !== "wire" ||
          wire.layer !== "top" ||
          (b.route_type === "wire" && b.layer !== "top")
        )
          continue
        const color =
          trace.pcb_trace_id === ground.pcb_trace_id ? "#d97706" : "#0284c7"
        graphics.lines!.push({
          points: [a, b],
          strokeWidth: wire.width,
          strokeColor: color,
        })
        graphics.circles!.push(
          { center: a, radius: wire.width / 2, fill: color, stroke: "none" },
          { center: b, radius: wire.width / 2, fill: color, stroke: "none" },
        )
      }
    }
    graphics.circles!.push({
      center: fixture.via,
      radius: fixture.via.hole_diameter / 2,
      fill: "white",
      stroke: "none",
    })
    graphics.rects!.push({
      center: { x: -0.6, y: -0.25 },
      width: 1.3,
      height: 1.8,
      fill: "none",
      stroke: "none",
      label: "crop",
    })
    const svg = getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
      includeTextLabels: false,
    })
    const frame = svg.match(/<rect\b[^>]*data-label="crop"[^>]*\/>/)![0]
    const box = ["x", "y", "width", "height"]
      .map(
        (attribute) => frame.match(new RegExp(`\\s${attribute}="([^"]+)"`))![1],
      )
      .join(" ")
    const cropped = svg.replace(
      /<svg\b[^>]*>/,
      `<svg xmlns="http://www.w3.org/2000/svg" x="0" y="50" width="600" height="700" viewBox="${box}" overflow="hidden">`,
    )
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="white"/><text x="12" y="26" font-family="sans-serif" font-size="16">${label}</text>${cropped}</svg>`
  }
  expect(
    stackSvgsHorizontally([
      render(before, "Before: 0.8 mm DRC envelope; 1 clearance error"),
      render(after, "After: original 0.45 mm escape; 0 clearance errors"),
    ]),
  ).toMatchSvgSnapshot(import.meta.path)
})
