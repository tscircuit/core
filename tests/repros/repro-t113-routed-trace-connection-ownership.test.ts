import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { runAllRoutingChecks } from "@tscircuit/checks"
import { cju } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"

const sourceTraceIdByPcbTraceId = {
  source_trace_196__source_net_1_mst0_0: "source_trace_196",
  source_trace_197__source_net_15_mst4_0: "source_trace_197",
} as const

const affectedViewport = { minX: 30.8, minY: -5.5, maxX: 34.2, maxY: 2.2 }

const isInsideAffectedViewport = (point: { x: number; y: number }): boolean =>
  point.x >= affectedViewport.minX &&
  point.x <= affectedViewport.maxX &&
  point.y >= affectedViewport.minY &&
  point.y <= affectedViewport.maxY

const isVisibleInAffectedViewport = (element: AnyCircuitElement): boolean => {
  if (element.type === "pcb_board") return true
  if (element.type === "pcb_trace_error") {
    return Boolean(element.center && isInsideAffectedViewport(element.center))
  }
  if (element.type === "pcb_trace") {
    return element.route.some(
      (routePoint) =>
        (routePoint.route_type === "wire" || routePoint.route_type === "via") &&
        isInsideAffectedViewport(routePoint),
    )
  }
  if (
    element.type === "pcb_smtpad" ||
    element.type === "pcb_plated_hole" ||
    element.type === "pcb_via"
  ) {
    return "x" in element && "y" in element
      ? isInsideAffectedViewport(element)
      : false
  }
  return false
}

const getSvgChildren = (svg: string): string =>
  svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"))

const createPanelSvg = (label: string, pcbSvg: string, x: number): string => `<g
  transform="translate(${x}, 0)"
>
  <rect width="900" height="42" fill="#f4f4f4" />
  <text
    x="450"
    y="27"
    fill="#111"
    font-family="Arial, sans-serif"
    font-size="18"
    font-weight="700"
    text-anchor="middle"
  >${label}</text>
  <svg x="0" y="42" width="900" height="900" viewBox="0 0 900 900" overflow="hidden">
    ${getSvgChildren(pcbSvg)}
  </svg>
</g>`

test("real T113 Pipeline 9 MST traces keep their declared electrical owner", async () => {
  const fixtureUrl = new URL(
    "../fixtures/t113-linux-routed-trace-ownership/board.circuit.json.gz",
    import.meta.url,
  )
  const circuitJson = JSON.parse(
    gunzipSync(readFileSync(fixtureUrl)).toString(),
  ) as AnyCircuitElement[]
  const db = cju(circuitJson)

  for (const [pcbTraceId, expectedSourceTraceId] of Object.entries(
    sourceTraceIdByPcbTraceId,
  )) {
    const pcbTrace = db.pcb_trace.get(pcbTraceId)
    expect(pcbTrace).toBeDefined()
    expect(
      getSourceTraceIdForRoutedTrace({
        db,
        trace: pcbTrace as PcbTrace & { connection_name: string },
        subcircuit_id: pcbTrace?.subcircuit_id,
      }),
    ).toBe(expectedSourceTraceId)
  }

  const routedCircuitJson = circuitJson.filter(
    (element) => element.type !== "pcb_trace_error",
  )
  const beforeRoutingErrors = await runAllRoutingChecks(routedCircuitJson)
  expect(
    beforeRoutingErrors.filter((element) => element.type === "pcb_trace_error"),
  ).toHaveLength(5)

  const attributedCircuitJson = routedCircuitJson.map((element) => {
    if (element.type !== "pcb_trace") return element
    const sourceTraceId = getSourceTraceIdForRoutedTrace({
      db,
      trace: element as PcbTrace & { connection_name?: string },
      subcircuit_id: element.subcircuit_id,
    })
    return sourceTraceId
      ? { ...element, source_trace_id: sourceTraceId }
      : element
  })
  const afterRoutingErrors = await runAllRoutingChecks(attributedCircuitJson)
  expect(
    afterRoutingErrors.filter((element) => element.type === "pcb_trace_error"),
  ).toHaveLength(0)

  const beforeCircuitJson = [
    ...routedCircuitJson,
    ...beforeRoutingErrors.map((element) =>
      element.type === "pcb_trace_error"
        ? { ...element, message: "" }
        : element,
    ),
  ].filter(isVisibleInAffectedViewport)
  const afterCircuitJson = [
    ...attributedCircuitJson,
    ...afterRoutingErrors,
  ].filter(isVisibleInAffectedViewport)

  const pcbSvgOptions = {
    shouldDrawErrors: true,
    showErrorsInTextOverlay: false,
    viewport: affectedViewport,
    width: 900,
    height: 900,
  }
  const comparisonSvg = `<svg width="1816" height="942" viewBox="0 0 1816 942" xmlns="http://www.w3.org/2000/svg">
    ${createPanelSvg(
      "BEFORE · 5 FALSE CONTACTS",
      convertCircuitJsonToPcbSvg(beforeCircuitJson, pcbSvgOptions),
      0,
    )}
    ${createPanelSvg(
      "AFTER · 0 CONTACTS",
      convertCircuitJsonToPcbSvg(afterCircuitJson, pcbSvgOptions),
      916,
    )}
  </svg>`

  expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
