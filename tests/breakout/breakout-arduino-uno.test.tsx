import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("breakout routes Arduino Uno ATmega pins to board headers", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="68.6mm" height="53.3mm">
      <pinheader
        name="J_PWR"
        pinCount={8}
        footprint="pinrow8"
        pinLabels={["IOREF", "RESET", "3V3", "5V", "GND", "GND2", "VIN", "NC"]}
        pcbX={2.54}
        pcbY={-24.13}
      />
      <pinheader
        name="J_A"
        pinCount={6}
        footprint="pinrow6"
        pinLabels={["A0", "A1", "A2", "A3", "A4", "A5"]}
        pcbX={22.86}
        pcbY={-24.13}
      />
      <pinheader
        name="J_D0"
        pinCount={8}
        footprint="pinrow8"
        pinLabels={["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"]}
        pcbX={20.32}
        pcbY={24.13}
      />
      <pinheader
        name="J_D1"
        pinCount={10}
        footprint="pinrow10"
        pinLabels={[
          "SCL",
          "SDA",
          "AREF",
          "GND",
          "D13",
          "D12",
          "D11",
          "D10",
          "D9",
          "D8",
        ]}
        pcbX={-4.06}
        pcbY={24.13}
      />
      <pinheader
        name="J_ICSP"
        pinCount={6}
        footprint="pinrow6"
        pinLabels={["MISO", "5V", "SCK", "MOSI", "RESET", "GND"]}
        pcbX={31.88}
        pcbY={1.27}
        pcbRotation={90}
      />

      <breakout name="ATMEGA_BREAKOUT" padding="1.2mm">
        <chip
          name="U1"
          footprint="tqfp32"
          pinLabels={{
            pin1: "PD3",
            pin2: "PD4",
            pin3: "GND3",
            pin4: "VCC2",
            pin5: "GND2",
            pin6: "VCC1",
            pin7: "PB6",
            pin8: "PB7",
            pin9: "PD5",
            pin10: "PD6",
            pin11: "PD7",
            pin12: "PB0",
            pin13: "PB1",
            pin14: "PB2",
            pin15: "PB3",
            pin16: "PB4",
            pin17: "PB5",
            pin18: "AVCC",
            pin19: "ADC6",
            pin20: "AREF",
            pin21: "GND1",
            pin22: "ADC7",
            pin23: "PC0",
            pin24: "PC1",
            pin25: "PC2",
            pin26: "PC3",
            pin27: "PC4",
            pin28: "PC5",
            pin29: "PC6",
            pin30: "PD0",
            pin31: "PD1",
            pin32: "PD2",
          }}
          pcbX={10.295}
          pcbY={0.1}
        />
        <capacitor
          name="C_VCC"
          capacitance="100nF"
          footprint="0402"
          pcbX={4.295}
          pcbY={11.1}
          connections={{ pin1: "U1.VCC1", pin2: "U1.GND1" }}
        />
      </breakout>

      <trace from="J_D0.D0" to="U1.PD0" />
      <trace from="J_D0.D1" to="U1.PD1" />
      <trace from="J_D0.D2" to="U1.PD2" />
      <trace from="J_D0.D3" to="U1.PD3" />
      <trace from="J_D0.D4" to="U1.PD4" />
      <trace from="J_D0.D5" to="U1.PD5" />
      <trace from="J_D0.D6" to="U1.PD6" />
      <trace from="J_D0.D7" to="U1.PD7" />
      <trace from="J_D1.D8" to="U1.PB0" />
      <trace from="J_D1.D9" to="U1.PB1" />
      <trace from="J_D1.D10" to="U1.PB2" />
      <trace from="J_D1.D11" to="U1.PB3" />
      <trace from="J_D1.D12" to="U1.PB4" />
      <trace from="J_D1.D13" to="U1.PB5" />
      <trace from="J_A.A0" to="U1.PC0" />
      <trace from="J_A.A1" to="U1.PC1" />
      <trace from="J_A.A2" to="U1.PC2" />
      <trace from="J_A.A3" to="U1.PC3" />
      <trace from="J_A.A4" to="U1.PC4" />
      <trace from="J_A.A5" to="U1.PC5" />
      <trace from="J_D1.AREF" to="U1.AREF" />
      <trace from="J_PWR.RESET" to="U1.PC6" />
      <trace from="J_PWR.5V" to="U1.VCC1" />
      <trace from="J_PWR.5V" to="U1.VCC2" />
      <trace from="J_PWR.5V" to="U1.AVCC" />
      <trace from="J_PWR.GND" to="U1.GND1" />
      <trace from="J_PWR.GND2" to="U1.GND2" />
      <trace from="J_D1.GND" to="U1.GND3" />
      <trace from="J_D1.SDA" to="J_A.A4" />
      <trace from="J_D1.SCL" to="J_A.A5" />
      <trace from="J_ICSP.RESET" to="J_PWR.RESET" />
      <trace from="J_ICSP.5V" to="J_PWR.5V" />
      <trace from="J_ICSP.GND" to="J_PWR.GND" />
      <trace from="J_ICSP.MISO" to="J_D1.D12" />
      <trace from="J_ICSP.MOSI" to="J_D1.D11" />
      <trace from="J_ICSP.SCK" to="J_D1.D13" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutSourceGroup = circuit.db.source_group.getWhere({
    name: "ATMEGA_BREAKOUT",
  })
  const breakoutPcbGroup = circuit.db.pcb_group.getWhere({
    source_group_id: breakoutSourceGroup!.source_group_id,
  })

  expect(breakoutPcbGroup).toBeDefined()
  expect(autoroutingPhaseIoStack.length).toBeGreaterThanOrEqual(2)
  expect(circuit.db.source_trace.list().length).toBeGreaterThanOrEqual(36)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.pcb_trace_error_id?.startsWith("overlap_")),
  ).toEqual([])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "breakout-arduino-uno-autorouting-srj",
  )
}, 30_000)
