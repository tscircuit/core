import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

/** Draw board-world points in mm (+X right, +Y up, +Z above, right-handed).
 * The SVG flips Y only for display; all copper coordinates and widths are exact.
 */
export const getFixedCopperHandoffSnapshot = (
  views: { title: string; description: string; input: SimpleRouteJson }[],
): string => {
  const panelWidth = 700
  const panelHeight = 800
  const panels = views.map(({ title, description, input }, panelIndex) => {
    const { minX, maxX, minY, maxY } = input.bounds
    const scale = Math.min(640 / (maxX - minX), 640 / (maxY - minY))
    const copper: string[] = []
    const vias: string[] = []
    for (const obstacle of input.obstacles) {
      const color = obstacle.circuitJsonMetadata ? "#b7bdc8" : "#d78624"
      copper.push(
        obstacle.shape === "circle"
          ? `<ellipse cx="${obstacle.center.x}" cy="${obstacle.center.y}" rx="${obstacle.width / 2}" ry="${obstacle.height / 2}" fill="${color}" fill-opacity="0.65"/>`
          : `<rect x="${obstacle.center.x - obstacle.width / 2}" y="${obstacle.center.y - obstacle.height / 2}" width="${obstacle.width}" height="${obstacle.height}" fill="${color}" fill-opacity="0.65"/>`,
      )
    }
    for (const trace of input.traces ?? []) {
      for (const [pointIndex, point] of trace.route.entries()) {
        if (point.route_type === "via") {
          vias.push(
            `<circle cx="${point.x}" cy="${point.y}" r="${(point.via_diameter ?? input.minViaPadDiameter ?? 0.6) / 2}" fill="#186c66"/><circle cx="${point.x}" cy="${point.y}" r="${(point.via_hole_diameter ?? input.minViaHoleDiameter ?? 0.3) / 2}" fill="white"/>`,
          )
        }
        const next = trace.route[pointIndex + 1]
        if (
          (point.route_type !== "wire" && point.route_type !== "via") ||
          !next ||
          (next.route_type !== "wire" && next.route_type !== "via")
        ) continue
        const layer = point.route_type === "wire" ? point.layer : point.to_layer
        const width = point.route_type === "wire" ? point.width : next.route_type === "wire" ? next.width : input.minTraceWidth
        copper.push(
          `<line x1="${point.x}" y1="${point.y}" x2="${next.x}" y2="${next.y}" stroke="${layer === "top" ? "#c43e3e" : "#305fc2"}" stroke-width="${width}" stroke-linecap="round"/>`,
        )
      }
    }
    const fixedCount = (input.traces ?? []).filter((trace) => trace.isFixed).length
    return `<g transform="translate(${panelIndex * panelWidth} 0)">
      <text x="30" y="36" font-size="22" font-weight="700">${escape(title)}</text>
      <text x="30" y="66" font-size="15">${escape(description)}</text>
      <text x="30" y="93" font-size="15">${input.traces?.length ?? 0} structured traces (${fixedCount} fixed); ${input.obstacles.length} obstacles</text>
      <g transform="translate(${350 - ((minX + maxX) / 2) * scale} ${440 + ((minY + maxY) / 2) * scale}) scale(${scale} ${-scale})">
        <rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="#f7f8fb" stroke="#9099a8" stroke-width="${1 / scale}"/>
        ${copper.join("\n")}
        ${vias.join("\n")}
      </g>
      <text x="30" y="773" font-size="14">Red: top wire; blue: bottom wire; green: physical via; amber: proxy obstacle.</text>
    </g>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth * views.length}" height="${panelHeight}" viewBox="0 0 ${panelWidth * views.length} ${panelHeight}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial, sans-serif" fill="#172235">${panels.join("\n")}</g></svg>`
}
