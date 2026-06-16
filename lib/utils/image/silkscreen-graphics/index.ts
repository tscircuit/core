import type { BRepShape } from "circuit-json"
import { createFilledMask, imageBytesToBitmap } from "./bitmap-utils"
import {
  polygonArea,
  polygonsToBrepShapes,
  scalePolygonToTargetSize,
  simplifyPolygon,
} from "./polygon-utils"
import { extractBoundaryEdges, traceBoundaryLoops } from "./trace-utils"
import type {
  Bitmap,
  GraphicTargetSize,
  SilkscreenGraphicConversionInput,
} from "./types"

const bitmapToBrepShapes = ({
  bitmap,
  targetSize,
}: {
  bitmap: Bitmap
  targetSize: GraphicTargetSize
}): BRepShape[] => {
  const loops = traceBoundaryLoops(
    extractBoundaryEdges({
      filledMask: createFilledMask(bitmap),
      maskWidth: bitmap.width,
      maskHeight: bitmap.height,
    }),
  )
    .map(simplifyPolygon)
    .map((polygon) =>
      scalePolygonToTargetSize({
        polygon,
        bitmapWidth: bitmap.width,
        bitmapHeight: bitmap.height,
        targetSize,
      }),
    )
    .filter(
      (polygon) => polygon.length >= 4 && Math.abs(polygonArea(polygon)) > 1e-6,
    )

  if (loops.length === 0) {
    throw new Error(
      "Imported image does not contain any visible silkscreen geometry",
    )
  }

  return polygonsToBrepShapes(loops)
}

export const imageToBrepShapes = async ({
  importedImageBytes,
  contentType,
  sourceName,
  width,
  height,
}: SilkscreenGraphicConversionInput): Promise<BRepShape[]> => {
  const imageBytes = new Uint8Array(importedImageBytes)
  const targetSize = { width, height }
  const graphicSource = { contentType, sourceName }
  const bitmap = await imageBytesToBitmap({
    imageBytes,
    graphicSource,
    targetSize,
  })

  return bitmapToBrepShapes({ bitmap, targetSize })
}
