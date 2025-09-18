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

const DEFAULT_SCHEMATIC_PIN_SPACING = 0.2
const SCHEMATIC_PORT_RADIUS_TO_PIN_SPACING_RATIO = 0.1

const resolveTraceAnchorOffset = ({
  offset,
  pinSpacing,
}: {
  offset?: number
  pinSpacing?: number | null
}) => {
  if (typeof offset === "number") return offset

  const spacing =
    typeof pinSpacing === "number" && Number.isFinite(pinSpacing)
      ? Math.abs(pinSpacing)
      : DEFAULT_SCHEMATIC_PIN_SPACING

  return spacing * SCHEMATIC_PORT_RADIUS_TO_PIN_SPACING_RATIO
}

export const getSchematicPortTraceAnchor = ({
  center,
  facingDirection,
  offset,
  pinSpacing,
}: {
  center: { x: number; y: number }
  facingDirection?: SchematicPort["facing_direction"] | null
  offset?: number
  pinSpacing?: number | null
}): { x: number; y: number } => {
  if (!facingDirection) return center
  const direction = directionVectors[facingDirection]
  if (!direction) return center
  const resolvedOffset = resolveTraceAnchorOffset({ offset, pinSpacing })
  return {
    x: center.x - direction.x * resolvedOffset,
    y: center.y - direction.y * resolvedOffset,
  }
}
