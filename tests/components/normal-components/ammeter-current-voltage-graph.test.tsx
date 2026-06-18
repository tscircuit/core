import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/simulation-matcher"
import type { RootCircuit } from "lib/RootCircuit"

test("<ammeter /> renders current and voltage graph simulation svg", async () => {
  let circuitRef: RootCircuit | null = null
  const { circuit } = getTestFixture({
    platform: {
      spiceEngineMap: {
        fake: {
          simulate: async () => {
            const ammeterSourceComponent =
              circuitRef!.db.source_component.getWhere({
                name: "AM1",
              })!

            return {
              simulationResultCircuitJson: [
                {
                  type: "simulation_transient_voltage_graph",
                  simulation_transient_voltage_graph_id:
                    "simulation_transient_voltage_graph_0",
                  name: "VOUT",
                  color: "#315cff",
                  voltage_levels: [0, 1.5, 3, 1.5, 0],
                  time_per_step: 1,
                  start_time_ms: 0,
                  end_time_ms: 4,
                },
                {
                  type: "simulation_transient_current_graph",
                  simulation_transient_current_graph_id:
                    "simulation_transient_current_graph_0",
                  source_component_id:
                    ammeterSourceComponent.source_component_id,
                  name: "IAM1",
                  color: "#ff0000",
                  current_levels: [0, 0.5, 1.5, 0.5, 0],
                  time_per_step: 1,
                  start_time_ms: 0,
                  end_time_ms: 4,
                },
              ],
            }
          },
        },
      },
    },
  })
  circuitRef = circuit

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <voltagesource name="V1" voltage="5V" schX={-3} />
      <ammeter
        name="AM1"
        color="#ff0000"
        connections={{
          pos: ".V1 > .pin1",
          neg: ".R1 > .pin1",
        }}
      />
      <resistor name="R1" resistance="1k" schX={3} />
      <trace from=".R1 > .pin2" to=".V1 > .pin2" />
      <voltageprobe
        name="VOUT"
        color="#315cff"
        connectsTo=".R1 > .pin1"
        referenceTo=".V1 > .pin2"
      />
      <analogsimulation duration="4ms" spiceEngine="fake" />
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
    name: "IAM1",
    color: "#ff0000",
  })

  await expect(circuit).toMatchSimulationSnapshot(import.meta.path)
})
