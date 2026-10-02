import { normalizeDegrees } from "@tscircuit/math-utils"
import type { CadComponent } from "circuit-json"

/**
 * Compose a model-local Euler offset into the component's finalized board
 * placement. Angles are degrees in Circuit JSON's right-handed board-world
 * frame: +X right, +Y top, +Z above.
 *
 * A bottom footprint is placed as `Rz(pcb) * Ry(180)`. Moving a model's local
 * Z offset across that Y flip reverses the offset (`F * Rz(a) = Rz(-a) * F`),
 * while the component's board rotation keeps its sign.
 */
export const getCadModelRotation = ({
  layer,
  pcbRotationDegrees,
  modelRotationOffsetDegrees,
}: {
  layer: "top" | "bottom"
  pcbRotationDegrees: number
  modelRotationOffsetDegrees: { x: number; y: number; z: number }
}): NonNullable<CadComponent["rotation"]> => {
  const isBottomLayer = layer === "bottom"

  return {
    x: modelRotationOffsetDegrees.x,
    y: modelRotationOffsetDegrees.y + (isBottomLayer ? 180 : 0),
    z: normalizeDegrees(
      isBottomLayer
        ? pcbRotationDegrees - modelRotationOffsetDegrees.z
        : pcbRotationDegrees + modelRotationOffsetDegrees.z,
    ),
  }
}
