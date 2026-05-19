import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"

test("fanout automatically routes BGA9 balls to breakout points", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="34mm" height="34mm">
      <fanout name="U1_FANOUT" autorouter="auto" padding="4.1mm">
        <chip
          name="U1"
          footprint="bga9"
          pcbX={0}
          pcbY={0}
          pinLabels={{
            pin1: "VDD",
            pin2: "IO1",
            pin3: "IO2",
            pin4: "IO3",
            pin5: "GND",
            pin6: "IO4",
            pin7: "SDA",
            pin8: "SCL",
            pin9: "RESET",
          }}
        />
      </fanout>
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutPoints = circuit.db.pcb_breakout_point.list()
  expect(breakoutPoints).toHaveLength(9)
  expect(circuit.db.pcb_trace.list()).toHaveLength(9)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)

  for (const breakoutPoint of breakoutPoints) {
    const routeUsesBreakoutPoint = circuit.db.pcb_trace
      .list()
      .some((trace) =>
        trace.route.some((routePoint) =>
          getRoutePointPositions(routePoint).some(
            (position) =>
              Math.abs(position.x - breakoutPoint.x) < 0.6 &&
              Math.abs(position.y - breakoutPoint.y) < 0.6,
          ),
        ),
      )
    expect(routeUsesBreakoutPoint).toBe(true)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
