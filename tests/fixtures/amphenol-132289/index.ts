import { readFileSync } from "node:fs"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  KicadFootprintToCircuitJsonConverter,
  upgradeKicad5FootprintToKicad6,
} from "kicad-to-circuit-json"
import { stackSvgsVertically } from "stack-svgs"

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
 * as two labeled SVG views in pixels (+X right, +Y down).
 */
export const createAmphenolCopperSnapshot = (
  circuitJson: AnyCircuitElement[],
) => {
  const copperAndNotes = circuitJson.filter((element) =>
    ["pcb_board", "pcb_smtpad", "pcb_note_text"].includes(element.type),
  )
  return stackSvgsVertically(
    (["top", "bottom"] as const).flatMap((layer) => [
      `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="40">
        <rect width="1000" height="40" fill="#111" />
        <text x="500" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="20">${layer.toUpperCase()} COPPER (${layer === "top" ? "RED" : "BLUE"})</text>
      </svg>`,
      convertCircuitJsonToPcbSvg(copperAndNotes, {
        layer,
        width: 1000,
        height: 520,
        showPcbGroups: false,
      }),
    ]),
    { gap: 0, normalizeSize: false },
  )
}
