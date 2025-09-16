import type { SchematicPort } from "circuit-json"

const directionVectors: Record<
  NonNullable<SchematicPort["facing_direction"]>,
  { x: number; y: number }
> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
}

export const SCHEMATIC_PORT_TRACE_ANCHOR_OFFSET = 0.02

export const getSchematicPortTraceAnchor = ({
  center,
  facingDirection,
  offset = SCHEMATIC_PORT_TRACE_ANCHOR_OFFSET,
}: {
  center: { x: number; y: number }
  facingDirection?: SchematicPort["facing_direction"] | null
  offset?: number
}): { x: number; y: number } => {
  if (!facingDirection) return center
  const direction = directionVectors[facingDirection]
  if (!direction) return center
  return {
    x: center.x - direction.x * offset,
    y: center.y - direction.y * offset,
  }
}
