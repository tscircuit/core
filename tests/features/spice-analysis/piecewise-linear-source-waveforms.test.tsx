import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("piecewise-linear source props emit Circuit JSON and SPICE PWL sources", async () => {
  let capturedSpice = ""
  const fakeEngine: SpiceEngine = {
    async simulate(spiceString) {
      capturedSpice = spiceString
      return { simulationResultCircuitJson: [] }
    },
  }
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { fake: fakeEngine } },
  })

  circuit.add(
    <board routingDisabled>
      <voltagesource
        name="VIN"
        voltage="2.2V"
        voltageWaveform={[
          { time: "0ms", voltage: "2.2V" },
          { time: "1ms", voltage: "2.2V" },
          { time: "1.001ms", voltage: "4.2V" },
        ]}
      />
      <currentsource
        name="ILOAD"
        current="100mA"
        currentWaveform={[
          { time: "0ms", current: "100mA" },
          { time: "1ms", current: "100mA" },
          { time: "1.001ms", current: "1A" },
        ]}
      />
      <trace from=".VIN > .pin1" to="net.GND" />
      <trace from=".VIN > .pin2" to="net.VOUT" />
      <trace from=".ILOAD > .pos" to="net.VOUT" />
      <trace from=".ILOAD > .neg" to="net.GND" />
      <analog.transientsimulation
        duration="2ms"
        timePerStep="1us"
        spiceEngine="fake"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const voltageSource = circuit.db.simulation_voltage_source
    .list()
    .find((source) => !source.is_dc_source)
  const currentSource = circuit.db.simulation_current_source
    .list()
    .find((source) => !source.is_dc_source)
  expect(voltageSource?.voltage_waveform).toEqual({
    timestamps_ms: [0, 1, 1.001],
    voltage_values: [2.2, 2.2, 4.2],
  })
  expect(currentSource?.current_waveform).toEqual({
    timestamps_ms: [0, 1, 1.001],
    current_values: [0.1, 0.1, 1],
  })
  expect(capturedSpice).toContain("PWL(0 2.2 1m 2.2 1.001m 4.2)")
  expect(capturedSpice).toContain("PWL(0 0.1 1m 0.1 1.001m 1)")
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
