import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import { checkPcbTraceLengths } from "@tscircuit/checks"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"

function withoutAttribution(trace: PcbTrace) {
  const { source_trace_id, ...routed } = trace
  return routed
}

function traceLength(trace: PcbTrace): number {
  let length = 0
  for (const [index, point] of trace.route.entries()) {
    if (point.route_type === "via") length += 1.6
    const previous = trace.route[index - 1]
    if (
      point.route_type === "wire" &&
      previous?.route_type === "wire" &&
      point.layer === previous.layer
    ) {
      length += Math.hypot(point.x - previous.x, point.y - previous.y)
    }
  }
  return length
}

/** Full captured copper; only the view is cropped. Board-world points use mm,
 * +X right and +Y up in the right-handed PCB frame. SVG Y increases downward. */
function renderOwnership({
  circuit,
  sharedBranch,
  buckBypass,
  supervisorBypass,
  before,
}: {
  circuit: AnyCircuitElement[]
  sharedBranch: PcbTrace
  buckBypass: PcbTrace
  supervisorBypass: PcbTrace
  before: boolean
}): string {
  const width = 1100
  const height = 800
  const viewport = { minX: -18.8, maxX: -4.3, minY: -16.8, maxY: -8.2 }
  const scale = Math.min(
    width / (viewport.maxX - viewport.minX),
    height / (viewport.maxY - viewport.minY),
  )
  const screen = (point: { x: number; y: number }) => ({
    x: width / 2 + (point.x - (viewport.minX + viewport.maxX) / 2) * scale,
    y: height / 2 - (point.y - (viewport.minY + viewport.maxY) / 2) * scale,
  })
  const highlight = (trace: PcbTrace, color: string) =>
    trace.route
      .map((point, index) => {
        if (point.route_type === "via") {
          const center = screen(point)
          return `<circle cx="${center.x}" cy="${center.y}" r="11" fill="none" stroke="${color}" stroke-width="4"/>`
        }
        const previous = trace.route[index - 1]
        if (
          point.route_type !== "wire" ||
          previous?.route_type !== "wire" ||
          point.layer !== previous.layer
        )
          return ""
        const a = screen(previous)
        const b = screen(point)
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="6"/>`
      })
      .join("")
  const branchColor = before ? "#ffb547" : "#67c8ff"
  const title = before
    ? "Before: the shared VSYS feed is attributed to a local bypass"
    : "After: the shared feed belongs to VSYS"
  const detail = before
    ? `The ${traceLength(sharedBranch).toFixed(2)} mm feed shares only one endpoint with BUCK_INPUT_CAP`
    : `Local leads: BUCK_INPUT_CAP ${traceLength(buckBypass).toFixed(2)} mm; supervisor ${traceLength(supervisorBypass).toFixed(2)} mm / 5 mm`
  const svg = convertCircuitJsonToPcbSvg(circuit, {
    width,
    height,
    layer: "top",
    hiddenLayerOpacity: 0.15,
    shouldDrawErrors: false,
    viewport,
  })
  return svg
    .replace(
      "<style></style>",
      '<style>[data-type^="pcb_silkscreen"] {opacity: 0.12}</style>',
    )
    .replace(
      "</svg>",
      `${highlight(sharedBranch, branchColor)}${highlight(buckBypass, "#88ff88")}${highlight(supervisorBypass, "#88ff88")}
      <rect x="0" y="0" width="1100" height="110" fill="white"/>
      <text x="550" y="40" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#111">${title}</text>
      <text x="550" y="82" text-anchor="middle" font-family="sans-serif" font-size="23" fill="#222">${detail}</text>
      <rect x="0" y="700" width="1100" height="100" fill="white"/>
      <text x="25" y="735" font-family="sans-serif" font-size="22" fill="#222">C_3V3_IN / U_3V3.VIN (left) — C_MON_IO_VDD / U_MON_IO.VDD (right)</text>
      <text x="25" y="772" font-family="sans-serif" font-size="21" fill="#222">Green: local bypasses. ${before ? "Orange: feed incorrectly assigned to the left bypass." : "Blue: VSYS feed. Copper and local limits are unchanged."}</text></svg>`,
    )
}

test("RVboy's shared supply branch does not inherit either local bypass constraint", async () => {
  const circuit = JSON.parse(
    gunzipSync(
      readFileSync(
        new URL(
          "../fixtures/rvboy-shared-bypass-supply.json.gz",
          import.meta.url,
        ),
      ),
    ).toString(),
  ) as AnyCircuitElement[]
  const original = JSON.stringify(circuit)
  const db = su(circuit)
  const port = (componentName: string, pinName: string) => {
    const component = db.source_component
      .list()
      .find((e) => e.name === componentName)!
    const sourcePort = db.source_port
      .list()
      .find(
        (e) =>
          e.source_component_id === component.source_component_id &&
          (e.name === pinName || e.port_hints?.includes(pinName)),
      )!
    return db.pcb_port
      .list()
      .find((e) => e.source_port_id === sourcePort.source_port_id)!.pcb_port_id
  }
  const routeBetween = (
    start: ReturnType<typeof port>,
    end: ReturnType<typeof port>,
  ) =>
    db.pcb_trace.list().find((trace) => {
      const endpoints = new Set(
        trace.route.flatMap((point) =>
          point.route_type === "wire"
            ? [point.start_pcb_port_id, point.end_pcb_port_id]
            : [],
        ),
      )
      return endpoints.has(start) && endpoints.has(end)
    })!
  const buckCap = port("C_3V3_IN", "pin1")
  const supervisorCap = port("C_MON_IO_VDD", "pin1")
  const sharedBranch = routeBetween(buckCap, supervisorCap)
  const buckBypass = routeBetween(buckCap, port("U_3V3", "VIN"))
  const supervisorBypass = routeBetween(supervisorCap, port("U_MON_IO", "VDD"))
  const buckSource = db.source_trace
    .list()
    .find((e) => e.name === "BUCK_INPUT_CAP")!
  const supervisorSource = db.source_trace
    .list()
    .find((e) => e.name === "LOCAL_C_MON_IO_VDD")!
  const vsys = db.source_net.list().find((e) => e.name === "VSYS")!
  expect(sharedBranch.source_trace_id).toBe(buckSource.source_trace_id)
  const sharedSourceId = getSourceTraceIdForRoutedTrace({
    db,
    trace: withoutAttribution(sharedBranch),
    subcircuit_id: sharedBranch.subcircuit_id,
  })
  expect(sharedSourceId).toBe(vsys.source_net_id)
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: withoutAttribution(buckBypass),
    }),
  ).toBe(buckSource.source_trace_id)
  expect(
    getSourceTraceIdForRoutedTrace({
      db,
      trace: withoutAttribution(supervisorBypass),
    }),
  ).toBe(supervisorSource.source_trace_id)
  const realDetourIds = db.source_trace
    .list()
    .filter((e) =>
      ["LOCAL_C_MON_ANA_VDD", "LOCAL_C_MON_DDR_VDD"].includes(e.name ?? ""),
    )
    .map((e) => e.source_trace_id)
  const realDetours = checkPcbTraceLengths(circuit).filter((e) =>
    realDetourIds.includes(e.source_trace_id!),
  )
  expect(realDetours).toHaveLength(2)
  const corrected = circuit.map((e) =>
    e.type === "pcb_trace" && e.pcb_trace_id === sharedBranch.pcb_trace_id
      ? { ...e, source_trace_id: sharedSourceId }
      : e,
  )
  expect(
    checkPcbTraceLengths(corrected).filter((e) =>
      [buckSource.source_trace_id, supervisorSource.source_trace_id].includes(
        e.source_trace_id!,
      ),
    ),
  ).toEqual([])
  expect(
    checkPcbTraceLengths(corrected).filter((e) =>
      realDetourIds.includes(e.source_trace_id!),
    ),
  ).toEqual(realDetours)
  const tightLimit = structuredClone(corrected)
  const tightSource = tightLimit
    .filter((e) => e.type === "source_trace")
    .find((e) => e.source_trace_id === buckSource.source_trace_id)!
  tightSource.max_length = 2
  expect(
    checkPcbTraceLengths(tightLimit).find(
      (e) => e.source_trace_id === buckSource.source_trace_id,
    )?.actual_trace_length,
  ).toBeCloseTo(traceLength(buckBypass), 6)
  expect(JSON.stringify(circuit)).toBe(original)
  expect(
    corrected.filter((e) => e.type === "pcb_trace").map((e) => e.route),
  ).toEqual(circuit.filter((e) => e.type === "pcb_trace").map((e) => e.route))
  await expect(
    renderOwnership({
      circuit,
      sharedBranch,
      buckBypass,
      supervisorBypass,
      before: true,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "rvboy-shared-bypass-supply-before")
  await expect(
    renderOwnership({
      circuit: corrected,
      sharedBranch,
      buckBypass,
      supervisorBypass,
      before: false,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "rvboy-shared-bypass-supply-after")
})
