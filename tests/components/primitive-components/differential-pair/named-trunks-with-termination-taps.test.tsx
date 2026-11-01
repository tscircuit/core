import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routes named differential trunks separately from termination taps on their nets", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board
      width={24}
      height={18}
      schematicDisabled
      routeRemaining={false}
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
    >
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <resistor
        name="RT"
        resistance={100}
        footprint="0402"
        pcbX={1.5}
        pcbY={4}
      />
      <autoroutingphase
        name="CLOCK_TRUNKS"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      <autoroutingphase
        name="TERMINATION_TAPS"
        phaseIndex={1}
        autorouter="auto_local"
      />
      <trace
        name="CK_P"
        from=".U1 > .pin8"
        to=".U2 > .pin1"
        routingPhaseIndex={0}
        thickness={0.1}
      />
      <trace
        name="CK_N"
        from=".U1 > .pin7"
        to=".U2 > .pin2"
        routingPhaseIndex={0}
        thickness={0.1}
      />
      <trace
        name="TAP_P"
        from=".U2 > .pin1"
        to=".RT > .pin1"
        routingPhaseIndex={1}
        thickness={0.1}
      />
      <trace
        name="TAP_N"
        from=".U2 > .pin2"
        to=".RT > .pin2"
        routingPhaseIndex={1}
        thickness={0.1}
      />
      <bus
        name="CLOCK_BUS"
        connections={["CK_P", "CK_N"]}
        pcbAllowedLayers={["top"]}
        maxLengthSkew={0.1}
      />
      <differentialpair
        name="CLOCK_PAIR"
        positiveConnection="CK_P"
        negativeConnection="CK_N"
        maxLengthSkew={0.1}
        pcbTraceGap={0.1}
      />
      <pcbnotetext
        pcbY={-4}
        fontSize={0.35}
        text="Named U1-U2 clock trunks: skew <= 0.1 mm"
      />
      <pcbnotetext
        pcbY={-4.7}
        fontSize={0.35}
        text="RT = 100 ohms; its unequal taps are separate branches"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(json.filter((element) => element.type.endsWith("_error"))).toEqual([])
  expect(circuit.db.source_property_ignored_warning.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(4)
  const trunkSourceTraces = ["CK_P", "CK_N"].map(
    (name) => circuit.db.source_trace.getWhere({ name })!,
  )
  const trunkSourceTraceIds = trunkSourceTraces.map(
    (trace) => trace.source_trace_id,
  )
  const pairBus = circuit.db.source_bus.getWhere({ name: "CLOCK_PAIR" })!
  expect(pairBus.source_trace_ids).toEqual(trunkSourceTraceIds)
  expect(pairBus.differential_pair).toMatchObject({
    positive_source_trace_id: trunkSourceTraceIds[0],
    negative_source_trace_id: trunkSourceTraceIds[1],
  })
  expect(inputs[0].differentialPairs).toEqual([
    {
      connectionNames: [trunkSourceTraceIds[0], trunkSourceTraceIds[1]],
      lengthTolerance: 0.1,
      traceGap: 0.1,
    },
  ])
  const trunkLengths = trunkSourceTraceIds.map((source_trace_id) => {
    const trace = circuit.db.pcb_trace.getWhere({ source_trace_id })!
    return trace.route.slice(1).reduce((total, point, routeIndex) => {
      const previous = trace.route[routeIndex]
      if (point.route_type !== "wire" || previous.route_type !== "wire")
        throw new Error("Expected surface clock trunks")
      return total + Math.hypot(point.x - previous.x, point.y - previous.y)
    }, 0)
  })
  expect(Math.abs(trunkLengths[0] - trunkLengths[1])).toBeLessThanOrEqual(
    0.100001,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
  })
}, 30_000)
