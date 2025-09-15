import type { Direction } from "@tscircuit/props"

export const getExitingEdgeFromDirection = (
  direction: Direction,
): "top" | "bottom" | "left" | "right" => {
  return (
    (
      {
        up: "top",
        down: "bottom",
        left: "left",
        right: "right",
      } as const
    )[direction] ?? null
  )
}
