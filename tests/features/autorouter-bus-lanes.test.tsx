import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
test("bus_lanes phase forwards impedance and emits fixed-layer traces", async () => {
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
      <resistor name="B1" resistance="1k" footprint="0402" pcbX={4} pcbY={2} />
      <trace name="DATA0" from=".A0 > .pin2" to=".B0 > .pin1" />
      <trace name="DATA1" from=".A1 > .pin2" to=".B1 > .pin1" />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1"]}
        routingPhaseIndex={0}
        maxLengthSkew="0.05mm"
        targetImpedance="50ohm"
        pcbImpedanceProfile={{
          layer: "top",
          points: [
            { traceWidth: "0.1mm", impedance: "60ohm" },
            { traceWidth: "0.2mm", impedance: "40ohm" },
          ],
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson(),
    traces = json.filter((e) => e.type === "pcb_trace")
  expect(
    inputs.some((input) =>
      input.buses?.some(
        (bus: any) =>
          bus.targetImpedance === 50 &&
          bus.impedanceProfile?.points[0].traceWidth === 0.1,
      ),
    ),
  ).toBe(true)
  expect(traces).toHaveLength(2)
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
