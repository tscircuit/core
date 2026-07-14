import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multiple analog simulations keep separate experiments and group probe scopes", async () => {
  const spiceStrings: string[] = []
  const ngspiceEngine = await createNgspiceSpiceEngine()
  let nextSimulation = Promise.resolve()
  const capturingNgspiceEngine = {
    async simulate(spiceString: string) {
      spiceStrings.push(spiceString)
      const simulation = nextSimulation.then(() =>
        ngspiceEngine.simulate(spiceString),
      )
      nextSimulation = simulation.then(
        () => undefined,
        () => undefined,
      )
      return simulation
    },
  }
  const { circuit } = getTestFixture({
    platform: { spiceEngineMap: { ngspice: capturingNgspiceEngine } },
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
        spiceEngine="ngspice"
      />
      <analogsimulation
        name="root-slow"
        duration="2ms"
        timePerStep="200us"
        spiceEngine="ngspice"
      />

      <group name="first-stage">
        <voltageprobe name="FIRST_STAGE_PROBE" connectsTo=".R1 > .pin2" />
        <analogsimulation
          name="first-stage-sim"
          duration="3ms"
          timePerStep="300us"
          spiceEngine="ngspice"
        />
      </group>
      <group name="second-stage">
        <voltageprobe name="SECOND_STAGE_PROBE" connectsTo=".R2 > .pin2" />
        <analogsimulation
          name="second-stage-sim"
          duration="4ms"
          timePerStep="400us"
          spiceEngine="ngspice"
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
  expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(0)
  expect(voltageGraphs).toHaveLength(8)

  const expectedGraphsByExperiment: Record<
    string,
    { names: string[]; endTimeMs: number }
  > = {
    "root-fast": {
      names: ["FIRST_STAGE_PROBE", "ROOT_PROBE", "SECOND_STAGE_PROBE"],
      endTimeMs: 1,
    },
    "root-slow": {
      names: ["FIRST_STAGE_PROBE", "ROOT_PROBE", "SECOND_STAGE_PROBE"],
      endTimeMs: 2,
    },
    "first-stage-sim": {
      names: ["FIRST_STAGE_PROBE"],
      endTimeMs: 3,
    },
    "second-stage-sim": {
      names: ["SECOND_STAGE_PROBE"],
      endTimeMs: 4,
    },
  }
  const expectedVoltageByProbe: Record<string, number> = {
    ROOT_PROBE: 5,
    FIRST_STAGE_PROBE: 5 * (5 / 6),
    SECOND_STAGE_PROBE: 5 * (3 / 6),
  }

  for (const experiment of experiments) {
    const expected = expectedGraphsByExperiment[experiment.name]
    if (!expected) throw new Error(`Unexpected experiment: ${experiment.name}`)
    const experimentGraphs = voltageGraphs.filter(
      (graph) =>
        graph.simulation_experiment_id === experiment.simulation_experiment_id,
    )
    expect(experimentGraphs.map((graph) => graph.name).sort()).toEqual(
      expected.names,
    )
    for (const graph of experimentGraphs) {
      expect(graph.end_time_ms).toBeCloseTo(expected.endTimeMs)
      expect(graph.voltage_levels.length).toBeGreaterThan(1)
      expect(graph.timestamps_ms).toHaveLength(graph.voltage_levels.length)
      expect(graph.voltage_levels.every(Number.isFinite)).toBe(true)
      const expectedVoltage = graph.name
        ? expectedVoltageByProbe[graph.name]
        : undefined
      if (expectedVoltage === undefined) {
        throw new Error(`Unexpected voltage graph: ${graph.name}`)
      }
      expect(graph.voltage_levels.at(-1)).toBeCloseTo(expectedVoltage, 2)
    }
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
}, 120000)
