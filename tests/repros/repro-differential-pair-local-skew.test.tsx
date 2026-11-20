import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import type { PcbTrace } from "circuit-json"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function lengthToMidpoint({ route }: PcbTrace): number {
  const midpointIndex = route.findIndex(
    (point) => point.route_type === "wire" && point.x === 0,
  )
  if (midpointIndex < 0) throw new Error("Missing the route midpoint at x = 0")
  return getTraceLength(route.slice(0, midpointIndex + 1))
}

test("matched USB trace totals hide 1.236 mm of mid-route skew", async () => {
  const { circuit } = getTestFixture()
  const detourDepth = Math.hypot(0.5, 1) - 0.5
  circuit.add(
    <board width="30mm" height="8mm" routeRemaining={false}>
      <testpoint
        name="DP_SRC"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={-12}
        pcbY={0.3}
      />
      <testpoint
        name="DN_SRC"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={-12}
        pcbY={-0.3}
      />
      <testpoint
        name="DP_LOAD"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={12}
        pcbY={0.3}
      />
      <testpoint
        name="DN_LOAD"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={12}
        pcbY={-0.3}
      />
      <trace
        name="USB_DP"
        from=".DP_SRC > .pin1"
        to=".DP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 2, y: 0 },
          { x: 2.5, y: 1 },
          { x: 3, y: 0 },
          { x: 12, y: 0 },
        ]}
      />
      <trace
        name="USB_DN"
        from=".DN_SRC > .pin1"
        to=".DN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 12, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: -detourDepth },
          { x: 21, y: -detourDepth },
          { x: 21, y: 0 },
        ]}
      />
      <differentialpair
        name="USB"
        positiveConnection="USB_DP"
        negativeConnection="USB_DN"
        pcbTraceGap="0.45mm"
        maxLengthSkew="0.1mm"
      />
      <pcbnotetext
        pcbY={2.3}
        fontSize={0.55}
        text="Matched USB pair: 25.236 mm each"
      />
      <pcbnotetext
        pcbY={1.35}
        fontSize={0.45}
        text="D+ runs 1.236 mm longer here"
      />
      <pcbnotetext pcbX={-9.5} pcbY={-1.4} fontSize={0.45} text="D+ detour" />
      <pcbnotetext
        pcbX={8.5}
        pcbY={-1.7}
        fontSize={0.45}
        text="D- catches up"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const [pair] = circuit.db.source_bus.list()
  const positive = circuit.db.pcb_trace.getWhere({
    source_trace_id: pair?.differential_pair?.positive_source_trace_id,
  })
  const negative = circuit.db.pcb_trace.getWhere({
    source_trace_id: pair?.differential_pair?.negative_source_trace_id,
  })
  if (!positive || !negative) throw new Error("USB pair was not routed")

  expect(positive.trace_length).toBeCloseTo(25.2360679775, 9)
  expect(negative.trace_length).toBeCloseTo(positive.trace_length!, 9)
  expect(lengthToMidpoint(positive) - lengthToMidpoint(negative)).toBeCloseTo(
    1.2360679775,
    9,
  )
  expect(await runAllRoutingChecks(circuitJson)).toEqual([])
  expect(
    circuitJson.filter(
      ({ type }) => String(type) === "pcb_differential_pair_local_skew",
    ),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
