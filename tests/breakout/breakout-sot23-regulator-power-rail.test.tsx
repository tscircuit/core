import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("breakout routes sot23 regulator power rail parts without breakoutpoints", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="18mm" height="12mm">
      <breakout name="REG_BREAKOUT" padding="0.7mm">
        <chip
          name="U1"
          footprint="sot23"
          pinLabels={{
            pin1: "VIN",
            pin2: "GND",
            pin3: "VOUT",
          }}
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="CIN"
          capacitance="1uF"
          footprint="0402"
          pcbX={-3.2}
          pcbY={1.7}
          connections={{ pin1: "U1.VIN", pin2: "U1.GND" }}
        />
        <capacitor
          name="COUT"
          capacitance="1uF"
          footprint="0402"
          pcbX={3.2}
          pcbY={1.7}
          connections={{ pin1: "U1.VOUT", pin2: "U1.GND" }}
        />
      </breakout>
      <pinheader
        name="JIN"
        pinCount={2}
        footprint="pinrow2"
        pinLabels={["VIN", "GND"]}
        pcbX={-6}
        pcbY={-1}
      />
      <pinheader
        name="JOUT"
        pinCount={2}
        footprint="pinrow2"
        pinLabels={["VOUT", "GND"]}
        pcbX={6}
        pcbY={-1}
      />
      <resistor
        name="RLED"
        resistance="1k"
        footprint="0402"
        pcbX={4.4}
        pcbY={4}
        connections={{ pin1: "U1.VOUT", pin2: "net.PWR_LED" }}
      />
      <trace from="JIN.VIN" to="U1.VIN" />
      <trace from="JIN.GND" to="U1.GND" />
      <trace from="JOUT.VOUT" to="U1.VOUT" />
      <trace from="JOUT.GND" to="U1.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutSourceGroup = circuit.db.source_group.getWhere({
    name: "REG_BREAKOUT",
  })
  const breakoutPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: breakoutSourceGroup!.source_group_id,
  })

  expect(breakoutPcbGroup).toBeDefined()
  expect(circuit.db.pcb_breakout_point.list().length).toBe(3)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(7)
  expect(
    circuit.db.pcb_trace.list().every((trace) => trace.source_trace_id),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "breakout-sot23-regulator-power-rail-autorouting-srj",
    circuit,
  )

  const traceErrors = circuit.db.pcb_trace_error.list()
  const clearanceErrors = circuit.db.pcb_pad_trace_clearance_error.list()

  expect(traceErrors).toHaveLength(0)
  expect(clearanceErrors).toHaveLength(1)
  expect(
    clearanceErrors.filter((error) => error.message.includes("overlaps with")),
  ).toHaveLength(0)
  expect(
    clearanceErrors.filter((error) => error.message.includes("too close")),
  ).toHaveLength(1)
  expect(
    clearanceErrors.filter((error) =>
      error.message.includes("disconnected endpoint"),
    ),
  ).toHaveLength(0)
  expect(
    clearanceErrors.filter((error) =>
      error.message.includes("missing a connection"),
    ),
  ).toHaveLength(0)
})
