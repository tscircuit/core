import { expect, test } from "bun:test"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a declared ground pour allows a short connection to the plane", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
    // Pours are rendered after routing, so the preflight must use their declarations.
    expect(circuit.db.pcb_copper_pour.list()).toHaveLength(0)
  })

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      autorouter="auto-local"
      autorouterVersion="beta_pipeline7"
    >
      <pcbnotetext pcbY={-4} fontSize={0.7} text="GND: 2mm TO INNER PLANE" />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={-4}
        maxDecouplingTraceLength="30mm"
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        pcbX={4}
        connections={{ pin1: "net.GND", pin2: "net.SPARE" }}
      />
      <trace
        name="ground_stitch"
        from=".C1 > .pin2"
        to="net.GND"
        maxLength="2mm"
      />
      <copperpour
        layer="inner1"
        connectsTo="net.GND"
        clearance="0.3mm"
        boardEdgeMargin="0.5mm"
        unbroken
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(autoroutingStartCount).toBe(1)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_too_long_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThan(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThan(0)
  const groundSourceTrace = circuit.db.source_trace.getWhere({
    name: "ground_stitch",
  })!
  expect(groundSourceTrace.max_length).toBe(2)
  const groundPort = circuit.db.pcb_port.getWhere({
    source_port_id: groundSourceTrace.connected_source_port_ids[0],
  })!
  const groundRoute = circuit.db.pcb_trace
    .list()
    .find((trace) =>
      trace.route.some(
        (point) =>
          point.route_type === "wire" &&
          point.start_pcb_port_id === groundPort.pcb_port_id,
      ),
    )!.route
  const routePositions = groundRoute.flatMap(getRoutePointPositions)
  const planarRouteLength = routePositions
    .slice(1)
    .reduce((length, point, index) => {
      const previousPoint = routePositions[index]
      return (
        length +
        Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
      )
    }, 0)
  expect(planarRouteLength).toBeLessThanOrEqual(groundSourceTrace.max_length!)
  expect(
    groundRoute.some(
      (point) => point.route_type === "via" && point.to_layer === "inner1",
    ),
  ).toBe(true)
})
