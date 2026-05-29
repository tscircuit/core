import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("breakout routes qfp16 controller pins to header and passives without breakoutpoints", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="20mm" height="16mm">
      <breakout name="MCU_BREAKOUT" autorouter="auto" padding="1mm">
        <chip
          footprint="qfp16"
          name="U1"
          pinLabels={{
            pin1: "GPIO1",
            pin2: "GPIO2",
            pin3: "GPIO3",
            pin4: "GPIO4",
            pin5: "VCC",
            pin6: "GND",
            pin7: "SDA",
            pin8: "SCL",
            pin9: "RESET",
            pin10: "BOOT",
            pin11: "GPIO5",
            pin12: "GPIO6",
            pin13: "GPIO7",
            pin14: "GPIO8",
            pin15: "GPIO9",
            pin16: "GPIO10",
          }}
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={-3.5}
          pcbY={2.4}
        />
        <trace from="C1.1" to="U1.GPIO1" />
        <trace from="C1.2" to="U1.GPIO3" />
      </breakout>
      <pinheader
        name="J1"
        pinCount={4}
        footprint="pinrow4"
        pinLabels={["VCC", "GND", "SDA", "SCL"]}
        pcbX={7}
        pcbY={0}
        pcbRotation={90}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={-2.4}
        connections={{ pin1: "U1.RESET", pin2: "net.VCC" }}
      />
      <trace from="J1.VCC" to="U1.VCC" />
      <trace from="J1.GND" to="U1.GND" />
      <trace from="J1.SDA" to="U1.SDA" />
      <trace from="J1.SCL" to="U1.SCL" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutSourceGroup = circuit.db.source_group.getWhere({
    name: "MCU_BREAKOUT",
  })
  const breakoutPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: breakoutSourceGroup!.source_group_id,
  })

  expect(breakoutPcbGroup).toBeDefined()
  expect(circuit.db.pcb_breakout_point.list().length).toBe(4)
  expect(autoroutingPhaseIoStack.length).toBeGreaterThanOrEqual(2)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThanOrEqual(6)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "breakout-qfp16-with-header-and-passives-autorouting-srj",
    circuit,
  )
})
