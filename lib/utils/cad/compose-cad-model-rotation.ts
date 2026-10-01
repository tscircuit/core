import { normalizeDegrees } from "@tscircuit/math-utils"
import type { Point3 } from "circuit-json"

/**
 * Compose a model-local Euler offset into the component's finalized PCB
 * placement. Inputs and output are Euler angles in degrees. The output uses
 * Circuit JSON's right-handed board-world frame: +X right, +Y top, +Z above.
 *
 * Core applies the bottom-layer Y flip after the model-local Z offset. In the
 * emitted Euler frame, the PCB placement therefore changes sign while the
 * model-local offset retains its sign.
 */
export const composeCadModelRotation = ({
  layer,
  pcbCcwRotationDegrees,
  modelCcwRotationOffsetDegrees,
}: {
  layer: "top" | "bottom"
  pcbCcwRotationDegrees: number
  modelCcwRotationOffsetDegrees: Point3
}): Point3 => {
  const isBottomLayer = layer === "bottom"

  return {
    x: modelCcwRotationOffsetDegrees.x,
    y: modelCcwRotationOffsetDegrees.y + (isBottomLayer ? 180 : 0),
    z: normalizeDegrees(
      isBottomLayer
        ? modelCcwRotationOffsetDegrees.z - pcbCcwRotationDegrees
        : pcbCcwRotationDegrees + modelCcwRotationOffsetDegrees.z,
    ),
  }
}
