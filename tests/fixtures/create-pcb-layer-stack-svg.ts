import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"

type PcbLayer = "top" | "inner1" | "inner2" | "bottom"

const createLayerLabelSvg = (layer: PcbLayer) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="36"
  viewBox="0 0 800 36"
>
  <rect x="0" y="0" width="800" height="36" fill="#121212" />
  <text
    x="400"
    y="23"
    fill="#f4f4f4"
    font-family="Arial, sans-serif"
    font-size="18"
    font-weight="700"
    text-anchor="middle"
  >${layer}</text>
</svg>`

const createLayerPanelSvg = (
  circuitJson: AnyCircuitElement[],
  layer: PcbLayer,
) =>
  stackSvgsVertically(
    [
      createLayerLabelSvg(layer),
      convertCircuitJsonToPcbSvg(circuitJson, {
        layer,
        showDebugObjects: true,
        shouldDrawErrors: true,
      }),
    ],
    { gap: 0, normalizeSize: false },
  )

/**
 * Stack four PCB layer views. Circuit JSON geometry contains board-world
 * points in mm (+X right, +Y up, right-handed); the renderer maps them to SVG
 * screen points in pixels (+X right, +Y down).
 */
export const createPcbLayerStackSvg = (circuitJson: AnyCircuitElement[]) => {
  // The SVG renderer prioritizes connected ports over an error's center.
  // Use a rendering copy so each error marker points at the reported via.
  const circuitJsonWithErrorCenters = circuitJson.map((element) => {
    if (element.type === "pcb_trace_error" && element.center) {
      return { ...element, pcb_port_ids: [] }
    }
    return element
  })

  return stackSvgsVertically(
    [
      createLayerPanelSvg(circuitJsonWithErrorCenters, "top"),
      createLayerPanelSvg(circuitJsonWithErrorCenters, "inner1"),
      createLayerPanelSvg(circuitJsonWithErrorCenters, "inner2"),
      createLayerPanelSvg(circuitJsonWithErrorCenters, "bottom"),
    ],
    {
      gap: 16,
      normalizeSize: false,
      rootAttributes: { "data-testid": "pcb-layer-stack" },
    },
  )
}
