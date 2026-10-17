import { expect, test } from "bun:test"
import { resetSimulationColorState } from "lib/utils/simulation/getSimulationColorForId"
import { parseSimulationGraphValue } from "lib/utils/simulation/parseSimulationGraphValue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parseSimulationGraphValue parses scientific notation and SI prefixes", () => {
  expect(parseSimulationGraphValue("1e-3V")).toBeCloseTo(0.001, 10)
  expect(parseSimulationGraphValue("5e-4A")).toBeCloseTo(0.0005, 10)
  expect(parseSimulationGraphValue("5e2mV")).toBeCloseTo(0.5, 10)
  expect(parseSimulationGraphValue("+1E-3A")).toBeCloseTo(0.001, 10)
  expect(parseSimulationGraphValue("-2.5e-6V")).toBeCloseTo(-2.5e-6, 12)
  expect(parseSimulationGraphValue(1e-3)).toBe(0.001)
  expect(parseSimulationGraphValue("10mV")).toBeCloseTo(0.01, 10)
  expect(parseSimulationGraphValue(undefined)).toBeUndefined()
})

test("voltageprobe and ammeter emit scientific notation graph scale and offset", async () => {
  const { circuit } = getTestFixture({
    platform: { pcbDisabled: true, schematicDisabled: true },
  })

  circuit.add(
    <board routingDisabled>
      <resistor name="R1" resistance="1k" />
      <voltageprobe
        name="VP1"
        connectsTo=".R1 > .pin1"
        color="#315cff"
        graphVoltagePerDiv="1e-3V"
        graphVerticalOffset="-2e-3V"
      />
      <ammeter
        name="AM1"
        connections={{ pos: ".R1 > .pin1", neg: ".R1 > .pin2" }}
        graphCurrentPerDiv="5e-4A"
        graphVerticalOffset="+1E-3A"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  resetSimulationColorState()

  const traces = circuit.db.simulation_oscilloscope_trace.list()
  expect(traces).toHaveLength(2)

  const vpTrace = traces.find(
    (trace) => trace.simulation_voltage_probe_id !== undefined,
  )
  expect(vpTrace).toBeDefined()
  expect(vpTrace?.volts_per_div).toBeCloseTo(0.001, 10)
  expect(vpTrace?.display_center_offset_divs).toBeCloseTo(-2, 10)

  const amTrace = traces.find(
    (trace) => trace.simulation_current_probe_id !== undefined,
  )
  expect(amTrace).toBeDefined()
  expect(amTrace?.amps_per_div).toBeCloseTo(0.0005, 10)
  expect(amTrace?.display_center_offset_divs).toBeCloseTo(2, 10)
})
