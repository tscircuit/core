import { Resvg } from "@resvg/resvg-js"
import { createImageDiff } from "../tests/fixtures/compare-image-buffers"

// Rasterize the actual-run SVGs written by the regression test's finally block.
const directory = process.argv[2]
if (!directory) throw new Error("Pass the VIA_SPAN_EVIDENCE_DIR directory")
for (const api of ["pcbPath", "pcbPaths"]) {
  const svg = await Bun.file(`${directory}/${api}.svg`).text()
  await Bun.write(`${directory}/${api}.png`, new Resvg(svg).render().asPng())
  if (process.argv[3]) {
    await createImageDiff({
      reference: await Bun.file(`${process.argv[3]}/${api}.png`).bytes(),
      current: await Bun.file(`${directory}/${api}.png`).bytes(),
      diffPath: `${directory}/${api}-diff.png`,
      highlightColor: "#ff00ff",
    })
  }
}
