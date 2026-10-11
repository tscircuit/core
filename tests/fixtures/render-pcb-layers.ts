import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

/** Stack standard PCB views in physical layer order. */
export function renderPcbLayers(circuitJson: CircuitJson, caption: string) {
  const layers = ["top", "inner1", "inner2", "bottom"] as const
  const panels = layers.map((layer, index) => {
    const pcb = convertCircuitJsonToPcbSvg(circuitJson, {
      layer,
      width: 800,
      height: 320,
    })
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "")
      .replace(/ id="([^"]+)"/g, ` id="$1-${layer}"`)
      .replace(/url\(#([^)]+)\)/g, `url(#$1-${layer})`)
    return `<g transform="translate(0 ${40 + index * 350})"><text x="20" y="20">${layer}</text><g transform="translate(0 30)">${pcb}</g></g>`
  })
  const height = 40 + layers.length * 350
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}"><rect width="800" height="${height}" fill="white"/><g font-family="sans-serif" font-size="16" fill="#222"><text x="20" y="26">${caption.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</text>${panels.join("")}</g></svg>`
}
