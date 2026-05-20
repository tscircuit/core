import { expect, test } from "bun:test"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout routes soic8 sensor support parts to an i2c header without fanoutpoints", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="20mm" height="16mm">
      <fanout name="SENSOR_FANOUT" autorouter="auto" padding="0.8mm">
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{
            pin1: "SDA",
            pin2: "SCL",
            pin3: "ADDR",
            pin4: "GND",
            pin5: "INT",
            pin6: "NC1",
            pin7: "NC2",
            pin8: "VCC",
          }}
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={3.6}
          pcbY={1.8}
          connections={{ pin1: "U1.VCC", pin2: "U1.GND" }}
        />
      </fanout>
      <pinheader
        name="J1"
        pinCount={4}
        footprint="pinrow4"
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        pcbX={-6}
        pcbY={0}
        pcbRotation={90}
      />
      <resistor
        name="R1"
        resistance="4.7k"
        footprint="0402"
        pcbX={5.5}
        pcbY={3}
        connections={{ pin1: "U1.SDA", pin2: "net.VCC" }}
      />
      <resistor
        name="R2"
        resistance="4.7k"
        footprint="0402"
        pcbX={5.5}
        pcbY={-3}
        connections={{ pin1: "U1.SCL", pin2: "net.VCC" }}
      />
      <trace from="J1.VCC" to="U1.VCC" />
      <trace from="J1.GND" to="U1.GND" />
      <trace from="J1.SDA" to="U1.SDA" />
      <trace from="J1.SCL" to="U1.SCL" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const fanoutSourceGroup = circuit.db.source_group.getWhere({
    name: "SENSOR_FANOUT",
  })
  const fanoutPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: fanoutSourceGroup!.source_group_id,
  })

  expect(fanoutPcbGroup).toBeDefined()
  const fanoutPoints = circuit.db.pcb_breakout_point.list()
  expect(fanoutPoints).toHaveLength(12)
  expect(
    fanoutPoints.every(
      (point) => point.source_port_id || point.source_trace_id,
    ),
  ).toBe(true)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(6)
  expect(
    circuit.db.pcb_trace.list().filter((trace) => trace.route.length < 2),
  ).toHaveLength(0)
  const routePositions = circuit.db.pcb_trace
    .list()
    .flatMap((trace) => trace.route.flatMap(getRoutePointPositions))
  for (const breakoutPoint of fanoutPoints) {
    expect(
      routePositions.some(
        (position) =>
          Math.abs(position.x - breakoutPoint.x) <= 0.25 &&
          Math.abs(position.y - breakoutPoint.y) <= 0.25,
      ),
    ).toBe(true)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "fanout-soic8-sensor-to-i2c-header-autorouting-srj",
    { finalBoardCircuit: circuit },
  )
})
