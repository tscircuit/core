import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

/** Renders board-world points in mm (+X right, +Y up, +Z above, right handed).
 * circuit-to-svg owns the PCB-to-screen transform. The surrounding captions use
 * screen pixels (+X right, +Y down) and do not modify the captured geometry. */
export function renderOrangeCrabBusOwnership({
  circuitJson,
  matchingDataRouteCount,
  ramD5,
  ramD5HasSourceTrace,
  detail = false,
}: {
  circuitJson: AnyCircuitElement[]
  matchingDataRouteCount: number
  ramD5: PcbTrace
  ramD5HasSourceTrace: boolean
  detail?: boolean
}): string {
  const pcbSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    width: 1200,
    height: 620,
    viewport: detail
      ? { minX: -4, maxX: 20, minY: -7, maxY: 9 }
      : { minX: -27, maxX: 27, minY: -13, maxY: 13 },
    xRayElementIds: detail ? [ramD5.pcb_trace_id] : undefined,
    hiddenLayerOpacity: detail ? 0.15 : undefined,
    shouldDrawErrors: false,
    shouldDrawWarnings: false,
    showFabricationNotes: false,
    showSolderPaste: false,
    includeVersion: false,
  })
  const title = detail
    ? "OrangeCrab DDR detail: RAM_D5, U3.B13 to U4.H8"
    : "OrangeCrab rev 0.2.1: full captured reference circuit"
  const status = detail
    ? ramD5HasSourceTrace
      ? "RAM_D5 resolves to its matching source trace"
      : "RAM_D5 retains a net alias instead of its matching source trace"
    : `${matchingDataRouteCount}/16 DDR data routes resolve to their matching source traces`
  const statusColor = (
    detail
      ? ramD5HasSourceTrace
      : matchingDataRouteCount === 16
  )
    ? "#176a3a"
    : "#b42318"

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="805" viewBox="0 0 1200 805">
    <rect width="1200" height="805" fill="white"/>
    <g font-family="sans-serif" text-anchor="middle">
      <text x="600" y="36" font-size="26" fill="#111">${title}</text>
      <text x="600" y="76" font-size="23" fill="${statusColor}">${status}</text>
    </g>
    <g transform="translate(0,100)">${pcbSvg}</g>
    <g font-family="sans-serif" text-anchor="middle" fill="#222">
      <text x="600" y="753" font-size="19">${
        detail
          ? "Bright copper: captured RAM_D5 route. Faint copper: the rest of the original circuit."
          : "163 components, 170 source traces, 52 routed traces and 104 vias retained."
      }</text>
      <text x="600" y="786" font-size="18">Ownership is measured from Core; copper is unchanged. Non-DDR routing remains unfinished.</text>
    </g>
  </svg>`
}
