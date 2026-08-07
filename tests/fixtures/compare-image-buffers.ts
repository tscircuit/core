import { Resvg } from "@resvg/resvg-js"
import looksSame from "@tscircuit/image-utils/looks-same"
import * as fs from "node:fs"

type CompareImageOptions = {
  strict?: boolean
  tolerance?: number
  ignoreCaret?: boolean
  ignoreAntialiasing?: boolean
  antialiasingTolerance?: number
  pixelRatio?: number
  percentThreshold?: number
}

const isSvg = (image: Uint8Array) => {
  const prefix = Buffer.from(image).subarray(0, 1024).toString("utf8")
  return prefix.includes("<svg")
}

const toComparablePng = (image: Uint8Array) => {
  if (!isSvg(image)) return image
  return new Resvg(Buffer.from(image)).render().asPng()
}

export const compareImageBuffers = async (
  reference: Uint8Array,
  current: Uint8Array,
  options: CompareImageOptions = {},
) => {
  if (Buffer.from(reference).equals(Buffer.from(current))) {
    return {
      equal: true,
      differentPixels: 0,
      totalPixels: 1,
    }
  }

  return looksSame(
    toComparablePng(reference),
    toComparablePng(current),
    options,
  )
}

export const createImageDiff = async ({
  reference,
  current,
  diffPath,
  highlightColor,
  ...options
}: CompareImageOptions & {
  reference: Uint8Array
  current: Uint8Array
  diffPath: string
  highlightColor?: string
}) => {
  const diff = await looksSame.createDiff({
    reference: toComparablePng(reference),
    current: toComparablePng(current),
    highlightColor,
    ...options,
  })
  fs.writeFileSync(diffPath, diff)
}
