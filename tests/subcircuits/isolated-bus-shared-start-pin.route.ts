import type { Point } from "circuit-json"

/** Manual routes in mm, relative to Hub: +X right, +Y up, as PCB-local points. */
export const SHARED_START_PIN_ROUTES = {
  End1: [
    { x: -0.8, y: 2 },
    { x: 4, y: 2 },
  ],
  End2: [
    { x: -0.8, y: -2 },
    { x: 4, y: -2 },
  ],
} satisfies Record<string, Point[]>
