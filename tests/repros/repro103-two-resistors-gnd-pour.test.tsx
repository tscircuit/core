import { expect, test } from "bun:test"
import type { PcbTraceRoutePointWire } from "circuit-json"
import { getTestFixture } from "../fixtures/get-test-fixture"

const isCopperPourTaggedWireRoutePoint = (
  routePoint: unknown,
): routePoint is PcbTraceRoutePointWire & {
  is_inside_copper_pour?: boolean
  copper_pour_id?: string
} =>
  typeof routePoint === "object" &&
  routePoint !== null &&
  "route_type" in routePoint &&
  routePoint.route_type === "wire" &&
  "is_inside_copper_pour" in routePoint &&
  routePoint.is_inside_copper_pour === true &&
  "copper_pour_id" in routePoint &&
  typeof routePoint.copper_pour_id === "string"

test("repro103: two resistors on net.GND with a net.GND copper pour", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <net name="GND" />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={4}
        connections={{ pin1: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbErrors = circuitJson.filter((e) => e.type.match(/pcb_.*_error/))
  const pcbTraces = circuitJson.filter(
    (e): e is Extract<(typeof circuitJson)[number], { type: "pcb_trace" }> =>
      e.type === "pcb_trace",
  )
  const insideCopperPourSegments = pcbTraces.flatMap((trace) =>
    trace.route.filter(
      (routePoint, routePointIndex) =>
        routePointIndex < trace.route.length - 1 &&
        isCopperPourTaggedWireRoutePoint(routePoint),
    ),
  )

  expect(pcbErrors.length).toBe(0)
  expect(insideCopperPourSegments.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
