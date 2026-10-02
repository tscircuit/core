import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  measureRoutingQuality,
  measurePairInteriorGaps,
} from "tests/fixtures/am3352-ram-bus-lanes/measure-routing-quality"
import Board from "tests/fixtures/am3352-ram-bus-lanes"

test("bus_lanes routes AM3352 DDR3 from original pads without a custom algorithm", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Board />)
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(json.filter((e) => e.type.endsWith("_error"))).toEqual([])
  expect(json.filter((e) => e.type === "source_trace")).toHaveLength(47)
  expect(json.filter((e) => e.type === "pcb_trace")).toHaveLength(47)
  const traces = json.filter((e) => e.type === "pcb_trace")
  expect(new Set(traces.map((t) => t.source_trace_id)).size).toBe(47)
  for (const trace of traces) {
    const vias = trace.route.flatMap((p, i) =>
      p.route_type === "via" ? [i] : [],
    )
    expect(vias).toHaveLength(2)
    const carrier = trace.route.slice(vias[0] + 1, vias[1])
    expect(carrier.every((p) => p.route_type === "wire")).toBe(true)
    expect(
      new Set(
        carrier.map((p) => (p.route_type === "wire" ? p.layer : undefined)),
      ).size,
    ).toBe(1)
  }
  // Differential pairs also export source_bus membership in Circuit JSON.
  expect(
    json
      .filter((e) => e.type === "source_bus")
      .map((e) => e.name)
      .sort(),
  ).toEqual([
    "DDR_BYTE0",
    "DDR_BYTE1",
    "DDR_CK_PAIR",
    "DDR_DQS_PAIR0",
    "DDR_DQS_PAIR1",
  ])
  const scores = measureRoutingQuality(traces)
  expect(scores.reduce((n, s) => n + s.acuteCorners, 0)).toBe(0)
  // Guard the improved compact routing while allowing numerical roundoff.
  // These ceilings also accept the preceding 1549.71 mm / 540-turn result.
  expect(scores.reduce((n, s) => n + s.planarLength, 0)).toBeLessThanOrEqual(
    1550,
  )
  expect(Math.max(...scores.map((s) => s.detourRatio))).toBeLessThanOrEqual(
    2.05,
  )
  expect(
    scores.reduce((n, s) => n + s.detourRatio, 0) / scores.length,
  ).toBeLessThanOrEqual(1.55)
  expect(scores.reduce((n, s) => n + s.ordinaryTurns, 0)).toBeLessThanOrEqual(
    540,
  )
  expect(scores.reduce((n, s) => n + s.shortJogs, 0)).toBeLessThanOrEqual(145)
  for (const bus of json.filter((e) => e.type === "source_bus")) {
    const lengths = bus.source_trace_ids.map(
      (id) => scores.find((s) => s.sourceTraceId === id)!.planarLength,
    )
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
      bus.max_length_skew! + 1e-8,
    )
  }
  const namedTrace = (name: string) => {
    const source = json.find(
      (e) => e.type === "source_trace" && e.name === name,
    )
    if (!source || source.type !== "source_trace")
      throw Error(`Missing ${name}`)
    return traces.find((t) => t.source_trace_id === source.source_trace_id)!
  }
  for (const [positive, negative] of [
    ["DDR_DQS0", "DDR_DQSn0"],
    ["DDR_DQS1", "DDR_DQSn1"],
    ["DDR_CK", "DDR_CKn"],
  ]) {
    const pair = [namedTrace(positive), namedTrace(negative)]
    const lengths = measureRoutingQuality(pair).map((s) => s.planarLength)
    expect(Math.abs(lengths[0] - lengths[1])).toBeLessThanOrEqual(0.127 + 1e-8)
    const gaps = measurePairInteriorGaps(pair[0], pair[1])
    expect(gaps.min).toBeGreaterThanOrEqual(0.0999)
    expect(gaps.max).toBeLessThanOrEqual(0.155)
  }
  // Signal layers are explicit: the top layer contains only local dogbones.
  // Write snapshots only after every connectivity, DRC, and quality gate passes.
  for (const layer of ["inner1", "inner2", "bottom"] as const)
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}.test.tsx`),
      {
        layer,
        hiddenLayerOpacity: 0.08,
        width: 900,
        height: 1400,
        viewport: { minX: -10, maxX: 10, minY: -35, maxY: -2 },
      },
    )
}, 900_000)
