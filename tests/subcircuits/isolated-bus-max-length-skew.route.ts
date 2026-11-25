import type { Point } from "circuit-json"

/**
 * Manual routes for the skewed bus, so the snapshot doesn't change when the
 * autorouter does. Points are relative to each trace's starting resistor.
 */
export const SKEWED_BUS_ROUTES = {
  /** R1 to R2: about 2.4 mm. */
  A: [{ x: 2, y: 0 }],
  /** R3 to R4: about 10.4 mm, 8 mm longer than A. */
  B: [{ x: 6, y: 0 }],
} satisfies Record<string, Point[]>
