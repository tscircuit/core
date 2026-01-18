import { getBoundsFromPoints } from "@tscircuit/math-utils"
import { distance } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board"

export const getBoardDimensionsFromProps = (
  board: Board,
): { width: number; height: number } => {
  const props = board._parsedProps

  // Check for explicit width/height
  let width = props.width != null ? distance.parse(props.width) : undefined
  let height = props.height != null ? distance.parse(props.height) : undefined

  // Check for outline
  if ((width === undefined || height === undefined) && props.outline?.length) {
    const outlineBounds = getBoundsFromPoints(props.outline)
    if (outlineBounds) {
      width ??= outlineBounds.maxX - outlineBounds.minX
      height ??= outlineBounds.maxY - outlineBounds.minY
    }
  }

  // Check for circuitJson that contains pcb_board
  if (
    (width === undefined || height === undefined) &&
    props.circuitJson?.length
  ) {
    const pcbBoardFromJson = props.circuitJson.find(
      (elm: any) => elm.type === "pcb_board",
    )
    if (pcbBoardFromJson) {
      width ??= pcbBoardFromJson.width
      height ??= pcbBoardFromJson.height
    }
  }

  return {
    width: width ?? 0,
    height: height ?? 0,
  }
}
