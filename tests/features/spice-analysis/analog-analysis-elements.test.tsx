import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { analog } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("analog analysis elements create and execute every RFC experiment type", async () => {
  const spiceStrings: string[] = []
  const capturingEngine: SpiceEngine = {
    async simulate(spiceString) {
      spiceStrings.push(spiceString)
      return { simulationResultCircuitJson: [] }
    },
  }
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { capturing: capturingEngine } },
  })

  circuit.add(
    <board routingDisabled>
      <voltagesource name="V1" voltage="5V" acMagnitude="1V" />
      <resistor
        name="R1"
        resistance="1k"
        connections={{ pin1: ".V1 > .pin1", pin2: ".V1 > .pin2" }}
      />
      <voltageprobe name="VOUT" connectsTo=".R1 > .pin1" />
      <analog.transientsimulation
        name="transient"
        duration="2ms"
        timePerStep="20us"
        spiceEngine="capturing"
      />
      <analog.dcoperatingpointsimulation
        name="operating-point"
        spiceEngine="capturing"
      />
      <analog.dcsweepsimulation
        name="dc-sweep"
        sweepSource=".V1"
        sweepStart="0V"
        sweepStop="5V"
        sweepStep="1V"
        spiceEngine="capturing"
      />
      <analog.acsweepsimulation
        name="ac-sweep"
        sweepType="decade"
        startFrequency="10Hz"
        stopFrequency="1MHz"
        samplesPerInterval={20}
        spiceEngine="capturing"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    circuit.db.simulation_experiment
      .list()
      .map((experiment) => experiment.experiment_type),
  ).toEqual([
    "spice_transient_analysis",
    "spice_dc_operating_point",
    "spice_dc_sweep",
    "spice_ac_analysis",
  ])
  expect(spiceStrings).toHaveLength(4)
  expect(
    spiceStrings.some((spiceString) => /^\.tran /m.test(spiceString)),
  ).toBe(true)
  expect(spiceStrings.some((spiceString) => /^\.op$/m.test(spiceString))).toBe(
    true,
  )
  expect(spiceStrings.some((spiceString) => /^\.dc /m.test(spiceString))).toBe(
    true,
  )
  expect(
    spiceStrings.some((spiceString) => /^\.ac dec /m.test(spiceString)),
  ).toBe(true)
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
})
