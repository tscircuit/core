import type { PcbComponent } from "circuit-json"
import type { SimpleRouteJson } from "./SimpleRouteJson"

const GEOMETRY_TOLERANCE = 1e-6

/**
 * Check enclosed balls in a uniform square array of circular SMT pads.
 * Geometry is in right-handed board-world mm: +X right, +Y up, +Z above.
 * Pad centers and routing terminals are points, already placed and rotated.
 *
 * A complete ring of eight foreign-net pads can trap an interior terminal.
 * When no trace channel fits, it needs a via in one of the four interstices.
 * Their largest inscribed via has diameter sqrt(2) * pitch - pad diameter
 * - 2 * via clearance. Incomplete/nonuniform arrays are deliberately skipped.
 */
export const getDogboneViaSizeError = (
  srj: SimpleRouteJson,
  {
    componentNamesById,
    requiresDogbone = false,
  }: {
    componentNamesById?: ReadonlyMap<PcbComponent["pcb_component_id"], string>
    requiresDogbone?: boolean
  } = {},
): string | null => {
  if (srj.allowViaInPad || srj.layerCount < 2) return null
  // Existing copper can provide an escape that is absent from the terminals.
  if (srj.traces?.length) return null
  const viaDiameter = srj.minViaPadDiameter ?? srj.minViaDiameter ?? 0.6
  const traceClearance = srj.minTraceToPadEdgeClearance ?? 0.1
  const viaClearance = srj.minViaEdgeToPadEdgeClearance ?? traceClearance
  const pads = srj.obstacles.filter(
    (pad) => pad.shape === "circle" && pad.circuitJsonMetadata?.pcb_smtpad_id,
  )

  for (const connection of srj.connections) {
    const traceWidth =
      connection.nominalTraceWidth ?? connection.width ?? srj.minTraceWidth
    for (const terminal of connection.pointsToConnect) {
      const sourcePad = pads.find(
        (pad) =>
          pad.circuitJsonMetadata?.pcb_port_id === terminal.pcb_port_id &&
          terminal.pcb_port_id !== undefined &&
          Math.hypot(pad.center.x - terminal.x, pad.center.y - terminal.y) <
            GEOMETRY_TOLERANCE &&
          pad.layers.includes(terminal.layer),
      )
      if (!sourcePad?.componentId) continue
      const componentPads = pads.filter(
        (pad) =>
          pad !== sourcePad &&
          pad.componentId === sourcePad.componentId &&
          pad.layers.includes(terminal.layer) &&
          Math.abs(pad.width - sourcePad.width) < GEOMETRY_TOLERANCE,
      )
      const nearestPad = componentPads.reduce<
        (typeof pads)[number] | undefined
      >(
        (nearest, pad) =>
          !nearest ||
          Math.hypot(pad.center.x - terminal.x, pad.center.y - terminal.y) <
            Math.hypot(
              nearest.center.x - terminal.x,
              nearest.center.y - terminal.y,
            )
            ? pad
            : nearest,
        undefined,
      )
      if (!nearestPad) continue
      const dx = nearestPad.center.x - terminal.x
      const dy = nearestPad.center.y - terminal.y
      const pitch = Math.hypot(dx, dy)
      if (pitch < GEOMETRY_TOLERANCE) continue
      // Do not reject an escape that can remain on the pad's layer.
      if (
        !requiresDogbone &&
        pitch - sourcePad.width + GEOMETRY_TOLERANCE >=
          traceWidth + 2 * traceClearance
      )
        continue
      const ring = [-1, 0, 1].flatMap((x) =>
        [-1, 0, 1].flatMap((y) => {
          if (x === 0 && y === 0) return []
          const neighbor = componentPads.find(
            (pad) =>
              Math.hypot(
                pad.center.x - terminal.x - x * dx + y * dy,
                pad.center.y - terminal.y - x * dy - y * dx,
              ) < GEOMETRY_TOLERANCE,
          )
          return neighbor ? [neighbor] : []
        }),
      )
      if (ring.length !== 8) continue
      if (
        ring.some((pad) =>
          pad.connectedTo.some((net) => sourcePad.connectedTo.includes(net)),
        )
      )
        continue
      // A connection confined to this pad does not need an escape.
      if (
        !requiresDogbone &&
        !connection.pointsToConnect.some(
          (point) =>
            Math.hypot(point.x - terminal.x, point.y - terminal.y) >
              GEOMETRY_TOLERANCE || point.layer !== terminal.layer,
        )
      )
        continue
      const maximumViaDiameter =
        Math.SQRT2 * pitch - sourcePad.width - 2 * viaClearance
      if (viaDiameter <= maximumViaDiameter + GEOMETRY_TOLERANCE) continue
      const metadata = sourcePad.circuitJsonMetadata!
      const componentName =
        metadata.source_component_name ??
        componentNamesById?.get(sourcePad.componentId) ??
        "unnamed component"
      const padName =
        terminal.port_selector ??
        `${componentName}${metadata.source_port_name ? `.${metadata.source_port_name}` : " interior pad"}`
      return `Autorouting stopped before routing: the configured via pad diameter (${viaDiameter.toFixed(3)}mm) does not allow dogboning ${padName}. The ${pitch.toFixed(3)}mm pad pitch, ${sourcePad.width.toFixed(3)}mm pad diameter, and ${viaClearance.toFixed(3)}mm via-to-pad clearance allow a via pad diameter of at most ${Math.max(0, maximumViaDiameter).toFixed(3)}mm, ${requiresDogbone ? "and this phase requires dogbone vias" : "and no same-layer trace channel fits"}. Reduce minViaPadDiameter (and minViaHoleDiameter if needed), adjust the footprint or clearances, or enable via-in-pad if supported by your manufacturer.`
    }
  }
  return null
}
