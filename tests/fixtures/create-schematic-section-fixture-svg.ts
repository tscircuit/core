import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"

function inferManualPlacements(
  circuit: any,
): { name: string; schX: number; schY: number }[] {
  const all = circuit.selectAll("*") as any[]
  const results: { name: string; schX: number; schY: number }[] = []
  for (const comp of all) {
    const props = comp._parsedProps
    if (!props) continue
    if (props.schX !== undefined || props.schY !== undefined) {
      results.push({
        name: props.name ?? comp.name ?? "?",
        schX: props.schX ?? 0,
        schY: props.schY ?? 0,
      })
    }
  }
  return results
}

function createPlacementTextSvg(
  placements: { name: string; schX: number; schY: number }[],
  width: number,
): string {
  const items = placements.map((p) => `${p.name}(${p.schX}, ${p.schY})`)
  const line = `Manual Placements: ${items.join(", ")}`
  const lineHeight = 20
  const padding = 12
  const height = padding * 2 + lineHeight

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
    `<rect width="100%" height="100%" fill="#fff"/>`,
    `<text x="${padding}" y="${padding + lineHeight}" font-family="Menlo, Consolas, monospace" font-size="14" fill="#333">${line}</text>`,
    "</svg>",
  ].join("\n")
}

export function createSchematicSectionFixtureSvg(
  circuit: any,
  circuitJson: AnyCircuitElement[],
): string {
  const schematicSvg = convertCircuitJsonToSchematicSvg(circuitJson, {
    grid: { cellSize: 1, labelCells: true },
  })
  const manualPlacements = inferManualPlacements(circuit)
  const svgWidth = Number(schematicSvg.match(/width="(\d+)"/)?.[1] ?? 1200)
  const annotationSvg = createPlacementTextSvg(manualPlacements, svgWidth)
  return stackSvgsVertically([schematicSvg, annotationSvg], {
    gap: 8,
    normalizeSize: false,
  })
}
