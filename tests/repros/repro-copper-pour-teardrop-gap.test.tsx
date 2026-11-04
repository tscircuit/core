import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import { pcb_copper_pour, pcb_trace } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { reversePcbTraceRoute } from "lib/utils/reverse-pcb-trace-route"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a narrowing teardrop does not connect a separate same-net pour", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={6} routingDisabled>
      <net name="GND" />
      <testpoint name="A" footprintVariant="pad" padDiameter={0.8} />
      <testpoint name="B" footprintVariant="pad" pcbX={3} padDiameter={0.4} />
      <testpoint
        name="C"
        footprintVariant="pad"
        pcbX={1}
        pcbY={0.45}
        padDiameter={0.2}
      />
      <trace from="A.pin1" to="net.GND" />
      <trace from="B.pin1" to="net.GND" />
      <trace from="C.pin1" to="net.GND" />
      <trace
        from="A.pin1"
        to="B.pin1"
        thickness={0.2}
        pcbStraightLine
        pcbTeardrops
        pcbTeardropStart
        pcbTeardropEnd={false}
      />
      <pcbnotetext
        pcbY={2.7}
        fontSize={0.25}
        text="GND: A + B joined by a tapered trace"
      />
      <pcbnotetext
        pcbY={-1}
        fontSize={0.25}
        text="C is separated by a copper gap: one route required"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Keep the authored Circuit JSON rectangle exact; solving a JSX pour would
  // inset its outline by the board clearance before testing the contact graph.
  const gndNet = circuit.db.source_net.list()[0]!
  const pour = circuit.db.pcb_copper_pour.insert({
    shape: "rect",
    layer: "top",
    center: { x: 1.2, y: 1.25 },
    width: 0.8,
    height: 2,
    source_net_id: gndNet.source_net_id,
    subcircuit_id: gndNet.subcircuit_id,
    covered_with_solder_mask: true,
  })
  const trace = pcb_trace.parse(circuit.db.pcb_trace.list()[0])
  expect(trace.route[0]).toMatchObject({
    end_width: 0.2,
    width_interpolation_mode: "quadratic",
  })
  expect(
    trace.route[0].route_type === "wire" && trace.route[0].start_width,
  ).toBeCloseTo(0.64)
  if (trace.route[0].route_type !== "wire") {
    throw new Error("Expected a generated wire teardrop")
  }
  const narrowingWidth = trace.route[0].start_width!
  pcb_copper_pour.parse(pour)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })

  const circuitJson = circuit.getCircuitJson()
  // Both directions must preserve the gap, while real contact with either a
  // linear edge or a widening quadratic taper must still suppress routing.
  for (const scenario of [
    {
      mode: "quadratic",
      startWidth: narrowingWidth,
      endWidth: 0.2,
      bottom: 0.25,
      routes: 1,
    },
    {
      mode: "quadratic",
      startWidth: narrowingWidth,
      endWidth: 0.2,
      bottom: 0.15,
      routes: 1,
    },
    {
      mode: "linear",
      startWidth: narrowingWidth,
      endWidth: 0.2,
      bottom: 0.15,
      routes: 0,
    },
    {
      mode: "quadratic",
      startWidth: 0.2,
      endWidth: 0.8,
      bottom: 0.25,
      routes: 0,
    },
    { mode: "linear", startWidth: 0.2, endWidth: 0.8, bottom: 0.25, routes: 0 },
  ] as const) {
    for (const reverse of [false, true]) {
      const route = trace.route.map((point, index) =>
        index === 0 && point.route_type === "wire"
          ? {
              ...point,
              width: scenario.startWidth,
              start_width: scenario.startWidth,
              end_width: scenario.endWidth,
              width_interpolation_mode: scenario.mode,
            }
          : point,
      )
      const taperedTrace = pcb_trace.parse({
        ...trace,
        route: reverse ? reversePcbTraceRoute(route) : route,
      })
      const adjustedPour = pcb_copper_pour.parse({
        ...pour,
        center: { x: 1.2, y: (scenario.bottom + 2.25) / 2 },
        height: 2.25 - scenario.bottom,
      })
      const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
        subcircuit_id: gndNet.subcircuit_id,
        circuitJson: circuitJson.map((element) =>
          element.type === "pcb_trace"
            ? taperedTrace
            : element.type === "pcb_copper_pour"
              ? adjustedPour
              : element,
        ),
        ignoreExistingTopLevelPcbRouteState: true,
      })
      expect(simpleRouteJson.connections[0]!.pointsToConnect).toHaveLength(3)
      const router = new AutoroutingPipelineSolver({
        ...simpleRouteJson,
        traces: [],
      })
      while (!router.srjWithPointPairs && !router.failed && !router.solved) {
        router.step()
      }
      expect(router.failed).toBe(false)
      expect(
        router.srjWithPointPairs!.connections,
        `${scenario.mode}, ${scenario.startWidth} -> ${scenario.endWidth}, bottom=${scenario.bottom}, reverse=${reverse}`,
      ).toHaveLength(scenario.routes)
    }
  }
})
