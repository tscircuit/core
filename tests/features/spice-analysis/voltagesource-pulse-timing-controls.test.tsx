import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"

test("voltagesource emits pulse timing controls", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })

  circuit.add(
    <board schMaxTraceDistance={10} routingDisabled>
      <voltagesource
        name="V_EN"
        voltage="4.2V"
        waveShape="square"
        pulseDelay="1us"
        riseTime="1ns"
        fallTime="1ns"
        pulseWidth="2ms"
        period="4ms"
      />
      <resistor
        name="R_LOAD"
        resistance="1k"
        connections={{ pin1: "V_EN.pin1", pin2: "V_EN.pin2" }}
      />
      <voltageprobe name="V_EN_PROBE" connectsTo=".R_LOAD > .pin1" />
      <analogsimulation
        duration="5ms"
        timePerStep="50us"
        spiceEngine="ngspice"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.list()[0]).toMatchObject({
    ftype: "simple_voltage_source",
    pulse_delay: 0.001,
    rise_time: 0.000001,
    fall_time: 0.000001,
    pulse_width: 2,
    period: 4,
  })
  expect(circuit.db.simulation_voltage_source.list()[0]).toMatchObject({
    pulse_delay: 0.001,
    rise_time: 0.000001,
    fall_time: 0.000001,
    pulse_width: 2,
    period: 4,
  })
  expect(
    circuit
      .getCircuitJson()
      .some((el) => el.type === "simulation_transient_voltage_graph"),
  ).toBe(true)
  const graph = circuit
    .getCircuitJson()
    .find((el) => el.type === "simulation_transient_voltage_graph")
  expect(Math.min(...(graph?.voltage_levels ?? []))).toBeLessThan(0.1)
  expect(Math.max(...(graph?.voltage_levels ?? []))).toBeGreaterThan(4)

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
