import "tests/fixtures/extend-expect-any-svg"
import type { CircuitJson } from "circuit-json"
import type {
  LocalSkewSegment,
  LocalSkewTrace,
} from "lib/utils/local-skew/pcb-differential-pair-local-skew"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"
import { getStoredLocalSkew } from "./get-stored-local-skew"

/** Plots the emitted samples over the routed copper for visual regression tests. */
export function localSkewSvg(circuitJson: CircuitJson): string {
  const pairs = getStoredLocalSkew(circuitJson)
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")
  const points = traces.flatMap((trace) =>
    trace.route.flatMap(getRoutePointPositions),
  )
  const minX = Math.min(...points.map(({ x }) => x)) - 1
  const maxX = Math.max(...points.map(({ x }) => x)) + 1
  const minY = Math.min(...points.map(({ y }) => y)) - 1
  const maxY = Math.max(...points.map(({ y }) => y)) + 1
  const width = maxX - minX
  const height = maxY - minY
  const copper = traces.flatMap((trace) =>
    trace.route.flatMap((point, index) => {
      const from = trace.route[index - 1]
      if (
        point.route_type !== "wire" ||
        from?.route_type !== "wire" ||
        from.layer !== point.layer
      )
        return []
      return [
        `<line x1="${from.x}" y1="${from.y}" x2="${point.x}" y2="${point.y}" stroke="#8d6448" stroke-width="${point.width}"/>`,
      ]
    }),
  )
  const vias = circuitJson
    .filter((element) => element.type === "pcb_via")
    .map(
      (via) =>
        `<circle cx="${via.x}" cy="${via.y}" r="${via.outer_diameter / 2}" fill="none" stroke="#ead9bd" stroke-width="0.07"/>`,
    )
  const tracks = pairs.flatMap(({ positive, negative }) => [positive, negative])
  const samples = tracks.flatMap((track) =>
    track.segments.map((segment) => skewLine(track, segment)),
  )
  const maxima = pairs
    .map(({ max_local_skew }) => max_local_skew?.toFixed(5) ?? "unknown")
    .join(", ")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width * 40)}" height="${Math.ceil(height * 40)}" viewBox="${minX} ${-maxY} ${width} ${height}">
  <rect x="${minX}" y="${-maxY}" width="${width}" height="${height}" fill="#182124"/>
  <g transform="scale(1 -1)">
    ${[...copper, ...samples, ...vias].join("\n    ")}
  </g>
  <text x="${minX + 0.3}" y="${-maxY + 0.48}" font-family="sans-serif" font-size="0.32" fill="#fff">Max local skew (mm): ${maxima || "no measurable pairs"}. Blue: ahead. Orange: behind. Grey: unknown.</text>
</svg>`
}

function skewLine(trace: LocalSkewTrace, segment: LocalSkewSegment): string {
  const { start, end, width, local_skew: skew } = segment
  let color = "#878e92"
  if (skew !== undefined) {
    const scale =
      skew < 0 ? trace.negative_skew_scale : trace.positive_skew_scale
    const amount = scale === 0 ? 0 : Math.min(1, Math.abs(skew) / scale)
    const hue = skew < 0 ? 26 : 200
    color = `hsl(${hue}, 95%, ${100 - 47 * amount}%)`
  }
  return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${color}" stroke-width="${width * 1.35}"/>`
}
