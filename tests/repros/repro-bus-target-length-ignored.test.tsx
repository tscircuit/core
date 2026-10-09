import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus targetLength reaches routing and DRC for the eight-bit trainer", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  circuit.add(
    <board width={62} height={32} schematicDisabled routeRemaining={false}>
      <chip name="U1" footprint="soic16" pcbX={-25} pcbY={-3} />
      <pinheader
        name="J1"
        pinCount={8}
        pitch="2.54mm"
        pcbX={23}
        pcbRotation={-90}
      />
      {Array.from({ length: 8 }, (_, pinIndex) => (
        <trace
          key={`D${pinIndex}`}
          name={`D${pinIndex}`}
          from={`U1.pin${16 - pinIndex}`}
          to={`J1.pin${pinIndex + 1}`}
        />
      ))}
      <bus
        name="DATA"
        connections={["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"]}
        routingPhaseIndex={0}
        targetLength="50mm"
        lengthTolerance="0.5mm"
        maxLengthSkew="0.1mm"
        pcbTraceWidth="0.2mm"
        pcbAllowedLayers={["top"]}
      />
      <autoroutingphase
        name="DATA_ROUTING"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      <pcbnotetext
        text="targetLength=50 mm; lengthTolerance=0.5 mm"
        pcbY={13}
        fontSize={0.8}
      />
      <pcbnotetext
        text="Actual: D0-D7=49.500 mm; all within target; zero DRC errors"
        pcbY={-13}
        fontSize={0.7}
      />
      {Array.from({ length: 8 }, (_, pinIndex) => (
        <pcbnotetext
          text={`D${pinIndex}`}
          pcbX={26}
          pcbY={8.89 - pinIndex * 2.54}
          fontSize={0.7}
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(8)
  const lengths = traces.map((trace) =>
    trace.route.slice(1).reduce((sum, point, index) => {
      const previous = trace.route[index]
      if (point.route_type !== "wire" || previous.route_type !== "wire") {
        throw new Error("Expected top-layer planar traces")
      }
      return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
    }, 0),
  )
  expect(
    traces.every((trace) =>
      trace.route.every(
        (point) => point.route_type === "wire" && point.layer === "top",
      ),
    ),
  ).toBe(true)

  const lengthEpsilonMm = 1e-7
  expect(Math.min(...lengths)).toBeGreaterThanOrEqual(49.5 - lengthEpsilonMm)
  expect(Math.max(...lengths)).toBeLessThanOrEqual(50.5 + lengthEpsilonMm)
  expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
    0.1 + lengthEpsilonMm,
  )
  expect(inputs).toHaveLength(1)
  expect(inputs[0].buses?.[0]).toMatchObject({
    maxLengthSkew: 0.1,
    minLength: 49.5,
    maxLength: 50.5,
  })
  expect(circuit.db.source_bus.list()[0]).toMatchObject({
    target_length: 50,
    length_tolerance: 0.5,
  })
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
