import type { AnyCircuitElement, PcbTrace, PcbVia } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

/**
 * Render the unedited compiled copper in X-ray so a same-net pour does not hide
 * its bridge. Highlight its native bridge, existing TOP fanouts and 0603 pads.
 * Restore the renderer's normal board outline and authored notes:
 * its X-ray mode currently omits these even when their IDs are selected.
 * Both renders use the same circuit-world viewport (mm, +X right, +Y up).
 * No physical paths, copper boundaries, vias or transforms are redrawn here.
 */
export const renderInnerViaNetIdentitySnapshot = (
  circuitJson: AnyCircuitElement[],
  bridge: PcbTrace,
  vias: PcbVia[],
) => {
  const options = {
    layer: "inner1" as const,
    viewport: { minX: -7, maxX: 7, minY: -5.25, maxY: 5.25 },
    showErrorsInTextOverlay: false,
    includeVersion: false,
  }
  const normalSvg = convertCircuitJsonToPcbSvg(circuitJson, options)
  const xRaySvg = convertCircuitJsonToPcbSvg(circuitJson, {
    ...options,
    xRayElementIds: [
      bridge.pcb_trace_id,
      ...vias.map((via) => via.pcb_via_id),
      ...circuitJson
        .filter((element) => element.type === "pcb_smtpad")
        .map((pad) => pad.pcb_smtpad_id),
      ...circuitJson
        .filter((element) => element.type === "pcb_trace")
        .map((trace) => trace.pcb_trace_id),
    ],
    hiddenLayerOpacity: 0.12,
  })
  const notes =
    normalSvg.match(
      /<text\b[^>]*class="pcb-note-text"[^>]*>[\s\S]*?<\/text>/g,
    ) ?? []
  const styles = normalSvg.match(/<style\b[^>]*>[\s\S]*?<\/style>/g) ?? []
  const boardOutline =
    normalSvg.match(/<path\b[^>]*class="pcb-board"[^>]*\/>/g) ?? []
  return xRaySvg.replace(
    "</svg>",
    [...styles, ...boardOutline, ...notes, "</svg>"].join(""),
  )
}
