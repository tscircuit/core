import { getSchematicNetLabelTextWidth } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import type { Bounds, Point } from "@tscircuit/math-utils"

const NET_LABEL_TEXT_HEIGHT = 0.18

export const getNetLabelTextBounds = ({
  center,
  text,
}: {
  center: Point
  text: string
}): Bounds => {
  const width = getSchematicNetLabelTextWidth({ text })
  const halfWidth = width / 2
  const halfHeight = NET_LABEL_TEXT_HEIGHT / 2
  return {
    minX: center.x - halfWidth,
    maxX: center.x + halfWidth,
    minY: center.y - halfHeight,
    maxY: center.y + halfHeight,
  }
}
