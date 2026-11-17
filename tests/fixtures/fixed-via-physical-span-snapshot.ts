import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  physicalBoardLayers,
  type observeFixedViaPhysicalSpans,
} from "./fixed-via-physical-span"

const escapeXml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

/** Four canonical PCB views retain board-world mm (+X right, +Y up).
 * The surrounding labels and occupancy matrix use screen pixels (+X right,
 * +Y down). Layer order is discrete, with no invented physical Z thickness.
 * All drawn PCB copper is pre-existing input; no candidate route is rendered.
 */
export const getFixedViaPhysicalSpanSnapshot = ({
  circuitJson,
  rows,
}: {
  circuitJson: AnyCircuitElement[]
  rows: ReturnType<typeof observeFixedViaPhysicalSpans>["rows"]
}) => {
  const missing = rows.filter(
    (row) =>
      !row.exportedLayers ||
      row.physicalLayers.length !== row.exportedLayers.length ||
      row.physicalLayers.some((layer) => !row.exportedLayers!.includes(layer)),
  ).length
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="880" viewBox="0 0 1600 880"><rect width="1600" height="880" fill="white"/>',
  ]
  svg.push(
    `<text x="28" y="42" font-family="sans-serif" font-size="28" font-weight="bold">${missing ? `REPRODUCED: ${missing} physical spans missing or changed` : "FIXED: all existing physical via spans preserved"}</text>`,
  )
  svg.push(
    '<text x="28" y="72" font-family="sans-serif" font-size="18">Same existing copper on every layer. Through barrel at (-2, 1); old blind barrel at (2, -1). Logical transitions: top to inner1.</text>',
  )
  for (const [layerIndex, layer] of physicalBoardLayers.entries()) {
    const panel = convertCircuitJsonToPcbSvg(circuitJson, {
      layer,
      width: 390,
      height: 300,
      backgroundColor: "white",
      shouldDrawErrors: false,
      shouldDrawRatsNest: false,
      showErrorsInTextOverlay: false,
      includeVersion: false,
      viewport: { minX: -6.6, maxX: 6.6, minY: -4.6, maxY: 4.6 },
    })
    svg.push(
      `<text x="${layerIndex * 400 + 28}" y="112" font-family="sans-serif" font-size="22" font-weight="bold">${layer}</text>`,
    )
    svg.push(panel.replace("<svg ", `<svg x="${layerIndex * 400}" y="125" `))
  }
  svg.push(
    '<text x="28" y="470" font-family="sans-serif" font-size="20">Boundary case</text><text x="405" y="470" font-family="sans-serif" font-size="20">Known physical barrel</text><text x="885" y="470" font-family="sans-serif" font-size="20">Physical span exported to bus solver</text>',
  )
  for (const [rowIndex, row] of rows.entries()) {
    const y = 525 + rowIndex * 75
    svg.push(
      `<text x="28" y="${y + 8}" font-family="sans-serif" font-size="20">${escapeXml(row.label)}</text>`,
    )
    for (const [layerIndex, layer] of physicalBoardLayers.entries()) {
      for (const [columnX, layers] of [
        [430, row.physicalLayers],
        [910, row.exportedLayers],
      ] as const) {
        const x = columnX + layerIndex * 100
        const fill =
          layers === undefined
            ? "#fff2cc"
            : layers.includes(layer)
              ? "#087c91"
              : "white"
        svg.push(
          `<circle cx="${x}" cy="${y}" r="13" fill="${fill}" stroke="#475569" stroke-width="2"/><text x="${x}" y="${y + 35}" text-anchor="middle" font-family="sans-serif" font-size="16">${layer}</text>`,
        )
      }
    }
    svg.push(
      `<text x="1320" y="${y + 8}" font-family="sans-serif" font-size="18" fill="${row.exportedLayers ? "#087c91" : "#a05a00"}">${row.exportedLayers ? "explicit span" : "MISSING"}</text>`,
    )
  }
  svg.push(
    '<text x="28" y="855" font-family="sans-serif" font-size="18">Teal = occupied layer; white = unoccupied; amber = physical span not exported. Current rule forbids NEW blind vias. No routing requested.</text></svg>',
  )
  return svg.join("")
}
