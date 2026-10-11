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
      }),
    ],
    { gap: 0, normalizeSize: false },
  )

export const createPcbLayerStackSvg = (circuitJson: AnyCircuitElement[]) =>
  stackSvgsVertically(
    [
      createLayerPanelSvg(circuitJson, "top"),
      createLayerPanelSvg(circuitJson, "inner1"),
      createLayerPanelSvg(circuitJson, "inner2"),
      createLayerPanelSvg(circuitJson, "bottom"),
    ],
    {
      gap: 16,
      normalizeSize: false,
      rootAttributes: { "data-testid": "pcb-layer-stack" },
    },
  )
