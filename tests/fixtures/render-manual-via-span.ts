import type { AnyCircuitElement, LayerRef } from "circuit-json"

/**
 * Annotated cross-section from emitted Circuit JSON. Board layers run from
 * +Z (top) to -Z (bottom); SVG +Y runs down. Layer spacing is schematic,
 * not a thickness measurement. Barrel width uses emitted pad/hole diameters.
 */
export const renderManualViaSpan = ({
  api,
  allowBlindAndBuriedVias,
  json,
  assertionsPassed,
}: {
  api: "pcbPath" | "pcbPaths"
  allowBlindAndBuriedVias?: boolean
  json: AnyCircuitElement[]
  assertionsPassed: boolean
}) => {
  const board = json.find((element) => element.type === "pcb_board")!
  const vias = json.filter((element) => element.type === "pcb_via")
  const stack = [
    "top",
    ...Array.from({ length: board.num_layers - 2 }, (_, i) => `inner${i + 1}`),
    "bottom",
  ]
  const errors = json.filter((element) => element.type.includes("error"))
  const color = assertionsPassed ? "#15803d" : "#be123c"
  const text = (x: number, y: number, label: string, extra = "") =>
    `<text x="${x}" y="${y}" ${extra}>${label}</text>`
  const displayedVias = vias.slice(0, 2)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="690" viewBox="0 0 1100 690">
    <style>text{font-family:Arial,sans-serif;fill:#172033;font-size:19px}.small{font-size:16px}.mono{font-family:monospace;font-size:16px}</style>
    <rect width="1100" height="690" fill="#f8fafc"/>
    ${text(550, 38, "Saved trace changes top ↔ inner2 on a four-layer PCB", 'text-anchor="middle" font-weight="bold" font-size="25"')}
    ${text(550, 70, `${api} · allowBlindAndBuriedVias=${allowBlindAndBuriedVias ?? "omitted"}`, 'text-anchor="middle"')}
    <rect x="467" y="87" width="166" height="43" rx="8" fill="${color}"/>
    ${text(550, 117, assertionsPassed ? "PASS" : "FAIL", 'text-anchor="middle" font-weight="bold" style="fill:white;font-size:28px"')}
    ${text(550, 158, "Expected: ordinary through-hole barrels occupy every copper layer", 'text-anchor="middle"')}
    <rect x="80" y="239" width="940" height="294" rx="8" fill="#e2e8f0"/>
    ${stack
      .map((layer, i) => {
        const y = 250 + i * 90
        return `<path d="M100 ${y} H1000" stroke="#b7791f" stroke-width="8"/>${text(110, y - 16, layer, 'font-weight="bold"')}`
      })
      .join("")}
    ${displayedVias
      .map((via, i) => {
        const x = 410 + i * 340
        const occupied = stack
          .map((layer, index) =>
            via.layers.includes(layer as LayerRef) ? index : -1,
          )
          .filter((index) => index >= 0)
        const startY = 250 + Math.min(...occupied) * 90
        const endY = 250 + Math.max(...occupied) * 90
        const outer = via.outer_diameter * 100
        const hole = via.hole_diameter * 100
        return `${text(x, 200, `${via.from_layer} → ${via.to_layer}`, 'text-anchor="middle" font-weight="bold"')}
        ${text(x, 224, `(${via.x.toFixed(2)}, ${via.y.toFixed(2)}) mm`, 'text-anchor="middle" class="small"')}
        <rect x="${x - outer / 2}" y="${startY - 8}" width="${outer}" height="${endY - startY + 16}" rx="4" fill="#d99b43" stroke="#784b15" stroke-width="2"/>
        <rect x="${x - hole / 2}" y="${startY - 8}" width="${hole}" height="${endY - startY + 16}" fill="#f8fafc"/>
        ${stack
          .map((layer, layerIndex) => {
            const y = 250 + layerIndex * 90
            return via.layers.includes(layer as LayerRef)
              ? `<circle cx="${x}" cy="${y}" r="9" fill="#172033"/>`
              : `<circle cx="${x}" cy="${y}" r="15" fill="#fff1f2" stroke="#be123c" stroke-width="3"/>${text(x + 23, y + 6, "MISSING", 'style="fill:#be123c;font-size:15px;font-weight:bold"')}`
          })
          .join("")}
        ${text(x, 566, "Emitted layers", 'text-anchor="middle" class="mono"')}
        ${text(x, 590, via.layers.join(", "), 'text-anchor="middle" style="font-family:monospace;font-size:13px"')}`
      })
      .join("")}
    ${text(550, 624, `Physical-span assertion over all ${vias.length} vias: ${assertionsPassed ? "PASS" : "FAIL"} · errors: ${errors.length}`, `text-anchor="middle" style="fill:${color};font-weight:bold"`)}
    ${text(550, 652, "Gold = emitted barrel extent · dots = occupied copper layers · circles = missing occupancy", 'text-anchor="middle" class="small"')}
    ${text(550, 680, "Logical route transitions are retained. Layer spacing is schematic; dimensions come from Circuit JSON.", 'text-anchor="middle" class="small"')}
  </svg>`
}
