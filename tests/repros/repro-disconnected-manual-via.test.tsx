import { expect, test } from "bun:test"
import {
  manualViaTransitionCases,
  renderManualViaTransition,
} from "tests/fixtures/manual-via-transition"
import { renderManualViaTransitionSvg } from "tests/fixtures/manual-via-transition-svg"

test("manual paths reject a via barrel that does not reach the incoming copper layer", async () => {
  const results = []
  const snapshots = []
  for (const api of ["pcbPath", "pcbPaths"] as const) {
    for (const scenario of manualViaTransitionCases.filter(
      (scenario) => scenario.invalid,
    )) {
      const circuit = await renderManualViaTransition(api, scenario)
      const sourceTrace = circuit.db.source_trace.list()[0]!
      const errors = circuit.db.pcb_trace_error.list()
      if (scenario.name === "disconnected_top") {
        snapshots.push({ api, svg: renderManualViaTransitionSvg(circuit, api) })
      }
      results.push({
        api,
        scenario: scenario.name,
        diagnosed: errors.some(
          (error) =>
            error.source_trace_id === sourceTrace.source_trace_id &&
            /via.*does not reach.*(top|inner1)/i.test(error.message),
        ),
        traceCount: circuit.db.pcb_trace.list().length,
        viaCount: circuit.db.pcb_via.list().length,
      })
    }
  }
  expect(results).toEqual([
    {
      api: "pcbPath",
      scenario: "disconnected_top",
      diagnosed: true,
      traceCount: 0,
      viaCount: 0,
    },
    {
      api: "pcbPath",
      scenario: "disconnected_inner",
      diagnosed: true,
      traceCount: 0,
      viaCount: 0,
    },
    {
      api: "pcbPaths",
      scenario: "disconnected_top",
      diagnosed: true,
      traceCount: 0,
      viaCount: 0,
    },
    {
      api: "pcbPaths",
      scenario: "disconnected_inner",
      diagnosed: true,
      traceCount: 0,
      viaCount: 0,
    },
  ])
  // Only establish expected snapshots after rejection assertions pass.
  // Actual upstream FAIL evidence lives separately in docs/repros.
  for (const { api, svg } of snapshots) {
    await expect(svg).toMatchSvgSnapshot(
      import.meta.path,
      `manual-via-transition-${api}`,
    )
  }
})
