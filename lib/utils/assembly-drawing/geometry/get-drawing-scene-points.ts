import { vec3 } from "gl-matrix"
import type { DrawCall } from "poppygl"

/** World-space glTF points, right-handed +Y up, in mm; apply placement once. */
export function getDrawingScenePoints(drawCalls: DrawCall[]) {
  return drawCalls.flatMap((drawCall) => {
    const indices =
      drawCall.indices ??
      Array.from({ length: drawCall.positions.length / 3 }, (_, i) => i)
    return Array.from(indices, (index) =>
      vec3.transformMat4(
        new Float64Array(3),
        drawCall.positions.subarray(index * 3, index * 3 + 3),
        drawCall.model,
      ),
    )
  })
}
