import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BOARD_THICKNESS = 1.6
const MAX_TRACE_LENGTH = 5

const getRoutePointPosition = (routePoint: PcbTraceRoutePoint) => ({
  x: "x" in routePoint ? routePoint.x : routePoint.start.x,
  y: "y" in routePoint ? routePoint.y : routePoint.start.y,
})

test("trace length includes the segment after a via", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" thickness={`${BOARD_THICKNESS}mm`}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={-1}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        layer="bottom"
        pcbX={3}
        pcbY={-1}
        pcbRotation={180}
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        maxLength={`${MAX_TRACE_LENGTH}mm`}
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[
          {
            x: 3,
            y: 0,
            via: true,
            fromLayer: "top",
            toLayer: "bottom",
          },
        ]}
      />

      <pcbnotetext
        pcbY={4}
        text="VIA TRACE LENGTH INCLUDES BOTH SEGMENTS"
        fontSize="0.45mm"
      />
      <pcbnotetext
        pcbY={3.2}
        text="ROUTE = 2.49 + 1.60 + 2.49 = 6.58 mm"
        fontSize="0.38mm"
      />
      <pcbnotetext
        pcbY={2.5}
        text="5 mm LIMIT PRODUCES A DRC ERROR"
        fontSize="0.38mm"
      />
      <pcbnotetext pcbY={0} text="VIA" fontSize="0.35mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })

  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace.route.map(({ route_type }) => route_type)).toEqual([
    "wire",
    "via",
    "wire",
  ])

  const [startPoint, viaPoint, endPoint] = pcbTrace.route.map(
    getRoutePointPosition,
  )
  const expectedTraceLength =
    Math.hypot(viaPoint.x - startPoint.x, viaPoint.y - startPoint.y) +
    BOARD_THICKNESS +
    Math.hypot(endPoint.x - viaPoint.x, endPoint.y - viaPoint.y)

  expect({
    storedTraceLength: Number(pcbTrace.trace_length?.toFixed(2)),
    traceLengthErrorCount: circuit.db.pcb_trace_too_long_error.list().length,
  }).toEqual({
    storedTraceLength: Number(expectedTraceLength.toFixed(2)),
    traceLengthErrorCount: 1,
  })
})
