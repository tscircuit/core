import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { AnyCircuitElement } from "circuit-json"

const escapeXml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

/** Label the rendered board-world XY copper (mm, +X right, +Y up) without changing its geometry. */
export function getLabeledPcbSvg(
  circuitJson: AnyCircuitElement[],
  title: string,
  details: string[],
): string {
  const lines = details.flatMap(
    (line) =>
      line.match(/.{1,88}(?:\s|$)/g)?.map((part) => part.trim()) ?? [line],
  )
  const headerHeight = 64 + lines.length * 20
  const hasBottomCopper = circuitJson.some(
    (element) =>
      (element.type === "pcb_smtpad" && element.layer === "bottom") ||
      (element.type === "pcb_trace" &&
        element.route.some(
          (point) => point.route_type === "wire" && point.layer === "bottom",
        )),
  )
  const layers = hasBottomCopper
    ? (["top", "bottom"] as const)
    : (["top"] as const)
  const panelWidth = 800 / layers.length
  const drawing = layers
    .map((layer, index) => {
      const board = convertCircuitJsonToPcbSvg(circuitJson, {
        width: panelWidth,
        height: 470,
        layer,
        showPcbNotes: true,
        shouldDrawErrors: true,
        shouldDrawRatsNest: false,
      })
      return `<g transform="translate(${index * panelWidth} 0)"><rect width="${panelWidth}" height="500" fill="#000"/><text x="16" y="22" font-family="monospace" font-size="15" fill="#fff">${layer.toUpperCase()} COPPER</text><g transform="translate(0 30)">${board}</g></g>`
    })
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${headerHeight + 500}" viewBox="0 0 800 ${headerHeight + 500}"><rect width="800" height="${headerHeight + 500}" fill="#fff"/><g font-family="monospace" fill="#111"><text x="16" y="30" font-size="20" font-weight="bold">${escapeXml(title)}</text>${lines.map((line, i) => `<text x="16" y="${55 + i * 20}" font-size="12">${escapeXml(line)}</text>`).join("")}</g><g transform="translate(0 ${headerHeight})">${drawing}</g></svg>`
}
