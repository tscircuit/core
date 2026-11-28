import type { Matrix } from "transformation-matrix"

type SideMarginKey =
  | "soldermask_margin_left"
  | "soldermask_margin_right"
  | "soldermask_margin_top"
  | "soldermask_margin_bottom"

/**
 * Maps per-side solder mask margins from the pad's own frame (as written on
 * the <smtpad>) to the frame of the emitted pcb_smtpad, which is the board
 * frame rotated by the pad's ccw_rotation. Rotation and bottom-side flips
 * move which board-facing edge each margin belongs to.
 */
export const mapSoldermaskSideMargins = ({
  pad,
  transform,
  padCcwRotationDegrees = 0,
  emittedCcwRotationDegrees = 0,
}: {
  pad: {
    solderMaskMarginLeft?: number
    solderMaskMarginRight?: number
    solderMaskMarginTop?: number
    solderMaskMarginBottom?: number
  }
  transform: Matrix
  padCcwRotationDegrees?: number
  emittedCcwRotationDegrees?: number
}): Partial<Record<SideMarginKey, number>> => {
  const result: Partial<Record<SideMarginKey, number>> = {}
  const pre = (padCcwRotationDegrees * Math.PI) / 180
  const post = (-emittedCcwRotationDegrees * Math.PI) / 180

  const sides: Array<[number | undefined, number, number]> = [
    [pad.solderMaskMarginLeft, -1, 0],
    [pad.solderMaskMarginRight, 1, 0],
    [pad.solderMaskMarginTop, 0, 1],
    [pad.solderMaskMarginBottom, 0, -1],
  ]

  for (const [value, x, y] of sides) {
    if (value === undefined) continue
    const px = x * Math.cos(pre) - y * Math.sin(pre)
    const py = x * Math.sin(pre) + y * Math.cos(pre)
    const bx = transform.a * px + transform.c * py
    const by = transform.b * px + transform.d * py
    const ex = bx * Math.cos(post) - by * Math.sin(post)
    const ey = bx * Math.sin(post) + by * Math.cos(post)

    const key: SideMarginKey =
      Math.abs(ex) >= Math.abs(ey)
        ? ex > 0
          ? "soldermask_margin_right"
          : "soldermask_margin_left"
        : ey > 0
          ? "soldermask_margin_top"
          : "soldermask_margin_bottom"
    result[key] = value
  }

  return result
}
