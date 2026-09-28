import { Resvg } from "@resvg/resvg-js"

/** Strict RGBA parity at a fixed raster size, including a foreground-only score. */
export function getPcbSvgPixelParity(original: string, replayed: string) {
  const options = {
    fitTo: { mode: "width" as const, value: 1200 },
    background: "black",
  }
  const a = new Resvg(original, options).render()
  const b = new Resvg(replayed, options).render()
  if (a.width !== b.width || a.height !== b.height)
    throw new Error("PCB raster sizes differ")
  const originalPixels = a.pixels
  const replayPixels = b.pixels
  let differentPixels = 0
  let foregroundPixels = 0
  for (let offset = 0; offset < originalPixels.length; offset += 4) {
    let differs = false
    let foreground = false
    for (let channel = 0; channel < 4; channel++) {
      if (originalPixels[offset + channel] !== replayPixels[offset + channel])
        differs = true
      if (
        channel < 3 &&
        (originalPixels[offset + channel] !== 0 ||
          replayPixels[offset + channel] !== 0)
      )
        foreground = true
    }
    if (differs) differentPixels++
    if (foreground) foregroundPixels++
  }
  return {
    differentPixels,
    parityPercent: 100 * (1 - differentPixels / (a.width * a.height)),
    foregroundParityPercent:
      100 * (1 - differentPixels / Math.max(1, foregroundPixels)),
  }
}
