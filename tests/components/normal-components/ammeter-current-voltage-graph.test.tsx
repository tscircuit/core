import { expect, test } from "bun:test"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"

test("<ammeter /> renders current and voltage graph simulation svg", async () => {
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
      <voltagesource name="V1" voltage="15V" schX={-3} />
      <ammeter
        name="AM1"
        color="#ff0000"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="2" schX={3} />
      <trace from=".R1 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="VOUT"
        color="#315cff"
        connectsTo=".R1 > .pin1"
        referenceTo=".V1 > .pin2"
      />
      <analogsimulation
        duration="1ms"
        timePerStep="100us"
        spiceEngine="ngspice"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const simulationExperiment = circuit.db.simulation_experiment.list()[0]!
  const voltageGraph = circuit.db.simulation_transient_voltage_graph.list()[0]!
  const currentGraph = circuit.db.simulation_transient_current_graph.list()[0]!

  expect(voltageGraph).toMatchObject({
    type: "simulation_transient_voltage_graph",
    simulation_experiment_id: simulationExperiment.simulation_experiment_id,
    name: "VOUT",
    color: "#315cff",
  })
  expect(currentGraph).toMatchObject({
    type: "simulation_transient_current_graph",
    simulation_experiment_id: simulationExperiment.simulation_experiment_id,
    name: "AM1",
    color: "#ff0000",
  })
  expect(currentGraph.current_levels.length).toBeGreaterThan(0)

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
}, 20000)
