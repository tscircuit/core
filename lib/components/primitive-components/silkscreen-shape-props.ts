import { pcbLayoutProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import type { z } from "zod"

// These Circuit JSON shapes have no stroke/fill fields. Reuse the shared PCB
// layout contract, including unit-aware placement and local CCW rotation.
const silkscreenShapeProps = pcbLayoutProps

export const silkscreenOvalProps = silkscreenShapeProps.extend({
  radiusX: distance,
  radiusY: distance,
})
export type SilkscreenOvalProps = z.input<typeof silkscreenOvalProps>

export const silkscreenPillProps = silkscreenShapeProps.extend({
  width: distance,
  height: distance,
})
export type SilkscreenPillProps = z.input<typeof silkscreenPillProps>
