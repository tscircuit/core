import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
test("bus_lanes phase matches selected bus lengths and emits fixed-layer traces", async () => {
  const { circuit } = getTestFixture()
  const inputs: any[] = []
  circuit.on("autorouting:start", (event: any) =>
    inputs.push(event.simpleRouteJson),
  )
  circuit.add(
    <board width={14} height={10}>
      <autoroutingphase
        name="BUS_LANES"
        phaseIndex={0}
        autorouter="bus_lanes"
        connections={["A0.pin2", "A1.pin2"]}
      />
      <resistor
        name="A0"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={-2}
      />
      <resistor name="B0" resistance="1k" footprint="0402" pcbX={4} pcbY={-2} />
      <resistor name="A1" resistance="1k" footprint="0402" pcbX={-4} pcbY={2} />
      <resistor name="B1" resistance="1k" footprint="0402" pcbX={3} pcbY={2} />
      <trace name="DATA0" from=".A0 > .pin2" to=".B0 > .pin1" />
      <trace name="DATA1" from=".A1 > .pin2" to=".B1 > .pin1" />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1"]}
        maxLengthSkew="0.5mm"
        pcbTraceWidth="0.15mm"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.2}
        fontSize={0.32}
        text="bus_lanes selects A0.pin2 and A1.pin2; all copper is top."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.85}
        fontSize={0.32}
        text="A1-B1 is 1mm shorter: add only 0.5mm, leaving permitted skew."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4.5}
        fontSize={0.32}
        text="Both routes: 0.15mm width, 0.5mm skew, zero vias."
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson(),
    traces = json.filter((e) => e.type === "pcb_trace")
  expect(
    inputs.some((input) =>
      input.buses?.some(
        (bus: any) => bus.maxLengthSkew === 0.5 && bus.traceWidth === 0.15,
      ),
    ),
  ).toBe(true)
  expect(traces).toHaveLength(2)
  const lengths = traces.map((trace) =>
    trace.route.slice(1).reduce((length, point, i) => {
      const previous = trace.route[i]
      if (point.route_type !== "wire" || previous.route_type !== "wire")
        throw new Error("Bus lanes must contain only wire segments")
      return length + Math.hypot(point.x - previous.x, point.y - previous.y)
    }, 0),
  )
  expect(Math.max(...lengths) - Math.min(...lengths)).toBeCloseTo(0.5, 7)
  expect(
    traces
      .flatMap((t) => t.route)
      .every(
        (p) =>
          p.route_type === "wire" &&
          p.layer === "top" &&
          Math.abs(p.width - 0.15) < 1e-7,
      ),
  ).toBe(true)
  expect(json.filter((e) => e.type === "pcb_via")).toHaveLength(0)
  expect(json.filter((e) => e.type === "pcb_autorouting_error")).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
