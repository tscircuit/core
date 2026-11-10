import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import { renderDdrBusOwnership } from "tests/fixtures/ddr-bus-net-trace-ownership/render"

test("the full board capture exposes DDR data route ownership", async () => {
  const capturedCircuitJson = gunzipSync(
    readFileSync(
      new URL(
        "../fixtures/ddr-bus-net-trace-ownership/circuit.json.gz",
        import.meta.url,
      ),
    ),
  )
  const circuitJson = JSON.parse(
    capturedCircuitJson.toString("utf8"),
  ) as AnyCircuitElement[]
  const originalCircuitJson = JSON.stringify(circuitJson)
  const db = su(circuitJson)
  expect(db.source_component.list()).toHaveLength(163)
  expect(db.source_trace.list()).toHaveLength(170)
  expect(db.pcb_trace.list()).toHaveLength(52)
  expect(db.pcb_via.list()).toHaveLength(104)

  const dataSourceTraceIds = new Set(
    db.source_bus.list().flatMap((bus) => bus.source_trace_ids ?? []),
  )
  const dataRouteOwnership = db.source_trace
    .list()
    .filter((sourceTrace) =>
      dataSourceTraceIds.has(sourceTrace.source_trace_id),
    )
    .map((sourceTrace) => {
      const pcbTrace = db.pcb_trace
        .list()
        .find(
          (trace) =>
            trace.source_trace_id &&
            sourceTrace.connected_source_net_ids.includes(
              trace.source_trace_id,
            ),
        )!
      return {
        sourceTrace,
        pcbTrace,
        resolvedSourceTraceId: getSourceTraceIdForRoutedTrace({
          db,
          trace: pcbTrace,
          subcircuit_id: pcbTrace.subcircuit_id,
        }),
      }
    })
  expect(dataRouteOwnership).toHaveLength(16)
  const routedCircuitJson = circuitJson.map((element) => {
    if (element.type !== "pcb_trace") return element
    const ownership = dataRouteOwnership.find(
      ({ pcbTrace }) => pcbTrace.pcb_trace_id === element.pcb_trace_id,
    )
    return ownership
      ? { ...element, source_trace_id: ownership.resolvedSourceTraceId }
      : element
  })
  expect(JSON.stringify(circuitJson)).toBe(originalCircuitJson)
  expect(
    routedCircuitJson
      .filter((element) => element.type === "pcb_trace")
      .map(({ source_trace_id, ...copper }) => copper),
  ).toEqual(db.pcb_trace.list().map(({ source_trace_id, ...copper }) => copper))

  const ramD5 = dataRouteOwnership.find(
    ({ sourceTrace }) => sourceTrace.display_name === "RAM_D5",
  )!
  expect(
    ramD5.sourceTrace.connected_source_port_ids.map((sourcePortId) => {
      const sourcePort = db.source_port.get(sourcePortId)!
      const sourceComponent = db.source_component.get(
        sourcePort.source_component_id!,
      )!
      return `${sourceComponent.name}.${sourcePort.name}`
    }),
  ).toEqual(["U3.NATIVE_B13", "U4.NATIVE_H8"])
  const snapshot = {
    circuitJson: routedCircuitJson,
    matchingDataRouteCount: dataRouteOwnership.filter(
      ({ sourceTrace, resolvedSourceTraceId }) =>
        resolvedSourceTraceId === sourceTrace.source_trace_id,
    ).length,
    ramD5: ramD5.pcbTrace,
    ramD5HasSourceTrace:
      ramD5.resolvedSourceTraceId === ramD5.sourceTrace.source_trace_id,
  }
  await expect(renderDdrBusOwnership(snapshot)).toMatchSvgSnapshot(
    import.meta.path,
    "ddr-bus-net-trace-ownership-full-board",
    { diffThresholdPercent: 0 },
  )
  await expect(
    renderDdrBusOwnership({ ...snapshot, detail: true }),
  ).toMatchSvgSnapshot(import.meta.path, "ddr-bus-net-trace-ownership-detail", {
    diffThresholdPercent: 0,
  })
})
