import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("spice-analysis01-platform-config", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board schMaxTraceDistance={10}>
      <voltagesource
        name="VS1"
        peakToPeakVoltage="3V"
        frequency="1kHz"
        waveShape="square"
      />
      <switch name="SW1" spst />
      <trace from="VS1.1" to="SW1.1" />
      <capacitor
        name="C1"
        capacitance="10uF"
        connections={{ pos: "SW1.2", neg: "VS1.2" }}
      />
      <resistor
        name="R1"
        resistance="1k"
        connections={{ pin1: "SW1.2", pin2: "VS1.2" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  expect(
    circuitJson.some((el) => el.type === "simulation_transient_voltage_graph"),
  ).toBe(true)

  expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
