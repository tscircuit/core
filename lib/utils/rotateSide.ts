export type Side = "left" | "right" | "top" | "bottom"

export function rotateSide(side: Side, rotation: number): Side {
  const r = ((rotation % 360) + 360) % 360
  if (r === 0) return side
  if (r === 90) {
    const mapping: Record<Side, Side> = {
      left: "bottom",
      right: "top",
      top: "left",
      bottom: "right",
    }
    return mapping[side]
  }
  if (r === 180) {
    const mapping: Record<Side, Side> = {
      left: "right",
      right: "left",
      top: "bottom",
      bottom: "top",
    }
    return mapping[side]
  }
  if (r === 270) {
    const mapping: Record<Side, Side> = {
      left: "top",
      right: "bottom",
      top: "right",
      bottom: "left",
    }
    return mapping[side]
  }
  return side
}
