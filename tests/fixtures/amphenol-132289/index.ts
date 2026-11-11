import { readFileSync } from "node:fs"
import type { AnyCircuitElement } from "circuit-json"
import {
  convertCircuitJsonToGltf,
  getBestCameraPosition,
} from "circuit-json-to-gltf"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  KicadFootprintToCircuitJsonConverter,
  upgradeKicad5FootprintToKicad6,
} from "kicad-to-circuit-json"
import { renderGLTFToPNGFromGLB } from "poppygl"
import { stackSvgsHorizontally } from "stack-svgs"

const source = readFileSync(
  new URL("./SMA_Amphenol_132289_EdgeMount.kicad_mod", import.meta.url),
  "utf8",
)
const converter = new KicadFootprintToCircuitJsonConverter()
// The KiCad 5 model's zero-valued `at` became `offset` in KiCad 6.
// This normalizes only 3D metadata; the upstream copper is unchanged.
converter.addFile(
  "SMA_Amphenol_132289_EdgeMount.kicad_mod",
  upgradeKicad5FootprintToKicad6(
    source.replace("(at (xyz 0 0 0))", "(offset (xyz 0 0 0))"),
  ),
)
converter.runUntilFinished()

/**
 * Imported footprint-local points in right-handed mm: +X right, +Y up,
 * +Z above the board. The converter reverses KiCad's downward Y axis;
 * core applies component placement and layer transforms afterward.
 */
export const amphenol132289CircuitJson = converter.getOutput()

/**
 * Render board-world points in right-handed mm (+X right, +Y up, +Z above)
 * as one PCB/top-3D/bottom-3D image in pixels (+X right, +Y down).
 * The shared camera fitter operates in the renderer's +Y-up glTF frame.
 */
export const createAmphenolThreePaneSnapshot = async (
  circuitJson: AnyCircuitElement[],
) => {
  const width = 1000
  const height = 560
  const copperAndNotes = circuitJson.filter((element) =>
    ["pcb_board", "pcb_smtpad", "pcb_note_text"].includes(element.type),
  )
  const glb = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 1024,
    includeModels: true,
    showBoundingBoxes: false,
  })
  if (!(glb instanceof Uint8Array || glb instanceof ArrayBuffer)) {
    throw new Error("Expected a GLB for the Amphenol 3D snapshot")
  }

  const panel = (title: string, subtitle: string, content: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + 90}">
      <rect width="100%" height="100%" fill="#111" />
      <text x="${width / 2}" y="34" text-anchor="middle" fill="white" font-family="Arial" font-size="26">${title}</text>
      <text x="${width / 2}" y="65" text-anchor="middle" fill="#ccc" font-family="Arial" font-size="19">${subtitle}</text>
      <g transform="translate(0 90)">${content}</g>
    </svg>`

  const pcb = panel(
    "PCB",
    "Top copper: red / bottom copper: blue",
    convertCircuitJsonToPcbSvg(copperAndNotes, {
      width,
      height,
      showPcbGroups: false,
    }),
  )
  const renders = await Promise.all(
    (["top", "bottom"] as const).map(async (side) => {
      const camera = getBestCameraPosition(copperAndNotes, {
        direction: [0, side === "top" ? 1 : -1, -0.4],
        fov: 30,
        aspectRatio: width / height,
      })
      const png = await renderGLTFToPNGFromGLB(glb, {
        ...camera,
        width,
        height,
        grid: false,
        backgroundColor: "#111111",
        lightDir: [0, side === "top" ? -1 : 1, 0],
        ambient: 0.8,
      })
      return panel(
        `3D ${side.toUpperCase()}`,
        "Left: J2 (bottom-mounted) / right: J1 (top-mounted)",
        `<image width="${width}" height="${height}" href="data:image/png;base64,${Buffer.from(png).toString("base64")}" />`,
      )
    }),
  )
  return stackSvgsHorizontally([pcb, ...renders], {
    gap: 12,
    normalizeSize: false,
  })
}
