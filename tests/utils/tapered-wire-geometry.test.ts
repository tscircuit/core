import { expect, test } from "bun:test"
import { Point as GeometryPoint } from "@flatten-js/core"
import type { PcbTraceRoutePointWire } from "circuit-json"
import {
  getTaperedWireGeometry,
  getTaperedWireObstacles,
} from "lib/utils/tapered-wire-geometry"
import "tests/fixtures/extend-expect-any-svg"

test("linear and quadratic tapered copper has flat caps and direction-independent geometry", () => {
  const drawings: string[] = []
  for (const [row, mode] of (["linear", "quadratic"] as const).entries()) {
    const wire: PcbTraceRoutePointWire = {
      route_type: "wire",
      x: 0,
      y: 0,
      width: 2,
      start_width: 2,
      end_width: 0.2,
      width_interpolation_mode: mode,
      layer: "top",
    }
    const geometry = getTaperedWireGeometry(wire, { x: 4, y: 0 })
    expect(geometry.bounds).toEqual({ left: 0, right: 4, bottom: -1, top: 1 })
    expect(geometry.polygon.contains(new GeometryPoint(-0.01, 0))).toBe(false)
    expect(geometry.polygon.contains(new GeometryPoint(4.01, 0))).toBe(false)
    const midWidth = mode === "linear" ? 1.1 : 0.65
    expect(geometry.widthAt(0.5)).toBeCloseTo(midWidth)
    expect(
      geometry.polygon.contains(new GeometryPoint(2, midWidth / 2 - 0.001)),
    ).toBe(true)
    expect(
      geometry.polygon.contains(new GeometryPoint(2, midWidth / 2 + 0.001)),
    ).toBe(false)
    const reversed = getTaperedWireGeometry(
      { ...wire, x: 4, width: 0.2, start_width: 0.2, end_width: 2 },
      { x: 0, y: 0 },
    )
    expect(reversed.polygon.area()).toBeCloseTo(geometry.polygon.area(), 8)
    const obstacle = getTaperedWireObstacles(wire, { x: 4, y: 0 }, [
      "net_1",
    ])[0]!
    expect(obstacle.width).toBe(4)
    expect(obstacle.height).toBe(2)
    drawings.push(
      `<g transform="translate(30,${70 + row * 130})"><text x="0" y="-43" font-size="16">${mode}: 2 mm to 0.2 mm, flat caps</text><polygon points="${geometry.outline.map((p) => `${p.x * 90},${p.y * 35}`).join(" ")}" fill="#bf7829" stroke="#422600"/></g>`,
    )
  }
  expect(
    `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="280"><rect width="100%" height="100%" fill="white"/>${drawings.join("")}</svg>`,
  ).toMatchSvgSnapshot(import.meta.path)
})
