import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"

test("fanout automatically routes QFN16 pins to breakout points", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="18mm">
      <fanout name="U1_FANOUT" autorouter="auto" padding="0.5mm">
        <chip
          name="U1"
          footprint="qfn16"
          pcbX={0}
          pcbY={0}
          pinLabels={{
            pin1: "GPIO1",
            pin2: "GPIO2",
            pin3: "GPIO3",
            pin4: "GPIO4",
            pin5: "SDA",
            pin6: "SCL",
            pin7: "INT",
            pin8: "RESET",
            pin9: "VDD",
            pin10: "GND",
            pin11: "MOSI",
            pin12: "MISO",
            pin13: "SCK",
            pin14: "CS",
            pin15: "ADC",
            pin16: "PWM",
          }}
        />
      </fanout>
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutPoints = circuit.db.pcb_breakout_point.list()
  expect(breakoutPoints).toHaveLength(16)
  expect(circuit.db.pcb_trace.list()).toHaveLength(16)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)

  for (const breakoutPoint of breakoutPoints) {
    expect(breakoutPoint.source_port_id).toBeDefined()
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
