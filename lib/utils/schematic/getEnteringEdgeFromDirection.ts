import type { Direction } from "@tscircuit/props"

export const getEnteringEdgeFromDirection = (
  direction: Direction,
): "top" | "bottom" | "left" | "right" => {
  return (
    (
      {
        up: "top",
        down: "bottom",
        left: "right",
        right: "left",
      } as const
    )[direction] ?? null
  )
}
