import type { Point } from "circuit-json"

/** Manual routes, relative to each trace's starting resistor. B is 8 mm longer than A. */
export const SKEWED_BUS_ROUTES = {
  A: [{ x: 2, y: 0 }],
  B: [{ x: 6, y: 0 }],
} satisfies Record<string, Point[]>
