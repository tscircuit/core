import { expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multiple analog simulations keep separate experiments and group probe scopes", async () => {
  const spiceStrings: string[] = []
  const mockSpiceEngine: SpiceEngine = {
    async simulate(spiceString) {
      spiceStrings.push(spiceString)
      return {
        simulationResultCircuitJson: [
          {
            type: "simulation_transient_voltage_graph",
            simulation_transient_voltage_graph_id: "mock_graph",
            simulation_experiment_id: "mock_experiment",
            voltage_levels: [0, 1],
            time_per_step: 1,
            start_time_ms: 0,
            end_time_ms: 1,
            name: "mock_graph",
          },
        ],
      }
    },
  }
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { mock: mockSpiceEngine } },
  })

  circuit.add(
    <board routingDisabled>
      <voltagesource name="V1" voltage="5V" />
      <resistor name="R1" resistance="1k" />
      <resistor name="R2" resistance="2k" />
      <resistor name="R3" resistance="3k" />
      <trace from=".V1 > .pin1" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
      <trace from=".R3 > .pin2" to=".V1 > .pin2" />

      <voltageprobe name="ROOT_PROBE" connectsTo=".V1 > .pin1" />
      <analogsimulation
        name="root-fast"
        duration="1ms"
        timePerStep="100us"
        spiceEngine="mock"
      />
      <analogsimulation
        name="root-slow"
        duration="2ms"
        timePerStep="200us"
        spiceEngine="mock"
      />

      <group name="first-stage">
        <voltageprobe name="FIRST_STAGE_PROBE" connectsTo=".R1 > .pin2" />
        <analogsimulation
          name="first-stage-sim"
          duration="3ms"
          timePerStep="300us"
          spiceEngine="mock"
        />
      </group>
      <group name="second-stage">
        <voltageprobe name="SECOND_STAGE_PROBE" connectsTo=".R2 > .pin2" />
        <analogsimulation
          name="second-stage-sim"
          duration="4ms"
          timePerStep="400us"
          spiceEngine="mock"
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const experiments = circuit.db.simulation_experiment.list()
  const voltageGraphs = circuit.db.simulation_transient_voltage_graph.list()
  expect(experiments.map((experiment) => experiment.name)).toEqual([
    "root-fast",
    "root-slow",
    "first-stage-sim",
    "second-stage-sim",
  ])
  expect(voltageGraphs).toHaveLength(4)
  for (const experiment of experiments) {
    expect(
      voltageGraphs.filter(
        (graph) =>
          graph.simulation_experiment_id ===
          experiment.simulation_experiment_id,
      ),
    ).toHaveLength(1)
  }

  expect(spiceStrings).toHaveLength(4)
  expect(
    spiceStrings.map(
      (spiceString) =>
        spiceString.match(/^\.PRINT TRAN (.+)$/m)?.[1].split(/\s+/).length ?? 0,
    ),
  ).toEqual([3, 3, 1, 1])
  expect(
    spiceStrings.map((spiceString) => spiceString.match(/^\.tran .+$/m)?.[0]),
  ).toEqual([
    ".tran 0.0001 0.001 UIC",
    ".tran 0.0002 0.002 UIC",
    ".tran 0.0003 0.003 UIC",
    ".tran 0.0004 0.004 UIC",
  ])
})
