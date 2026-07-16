import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"

test("fanout routes a chip pin through a fanoutpoint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="16mm">
      <fanout name="U1_FANOUT">
        <chip
          name="U1"
          footprint="soic8"
          pcbX={0}
          pcbY={0}
          pinLabels={{
            pin1: "GPIO1",
            pin2: "VCC",
            pin3: "SDA",
            pin4: "GND",
            pin5: "SCL",
            pin6: "GPIO2",
            pin7: "GPIO3",
            pin8: "GPIO4",
          }}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={6}
          pcbY={2}
        />
        <trace from="U1.VCC" to="C1.1" />
        <fanoutpoint connection="U1.GPIO1" pcbX={-5} pcbY={4} />
      </fanout>
    </board>,
  )

  await circuit.renderUntilSettled()

  const fanoutSourceGroup = circuit.db.source_group.getWhere({
    name: "U1_FANOUT",
  })
  const fanoutPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: fanoutSourceGroup!.source_group_id,
  })
  const fanoutPoint = circuit.db.pcb_breakout_point.list()[0]

  expect(fanoutPcbGroup).toBeDefined()
  expect(fanoutPoint).toBeDefined()
  if (!fanoutPcbGroup || !fanoutPoint) {
    throw new Error("Expected fanout group and fanout point to render")
  }
  expect(fanoutPoint.pcb_group_id).toBe(fanoutPcbGroup.pcb_group_id)
  expect(fanoutPoint.source_port_id).toBeDefined()
  expect(fanoutPoint.x).toBe(-5)
  expect(fanoutPoint.y).toBe(4)

  const traceThroughFanoutPoint = circuit.db.pcb_trace
    .list()
    .find((trace) =>
      trace.route.some((routePoint) =>
        getRoutePointPositions(routePoint).some(
          (position) =>
            Math.abs(position.x + 5) < 0.6 && Math.abs(position.y - 4) < 0.6,
        ),
      ),
    )

  expect(traceThroughFanoutPoint).toBeDefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const traceErrors = circuit.db.pcb_trace_error.list()
  const clearanceErrors = circuit.db.pcb_pad_trace_clearance_error.list()

  expect(traceErrors).toHaveLength(2)
  expect(
    traceErrors.filter((error) => error.message.includes("overlaps with")),
  ).toHaveLength(1)
  expect(
    traceErrors.filter((error) =>
      error.message.includes("disconnected endpoint"),
    ),
  ).toHaveLength(1)
  expect(
    traceErrors.filter((error) =>
      error.message.includes("missing a connection"),
    ),
  ).toHaveLength(0)
  expect(clearanceErrors).toHaveLength(0)
  expect(clearanceErrors[0]?.message).not.toInclude("too close")
})
