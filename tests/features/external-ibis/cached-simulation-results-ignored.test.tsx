import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached simulation results are ignored as on main", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <subcircuit
        name="Unsupported"
        circuitJson={[
          {
            type: "simulation_transient_voltage_graph",
            simulation_transient_voltage_graph_id:
              "simulation_transient_voltage_graph_0",
            simulation_experiment_id: "simulation_experiment_0",
            voltage_levels: [0, 1],
            timestamps_ms: [0, 1],
            time_per_step: 1,
            start_time_ms: 0,
            end_time_ms: 1,
          },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_transient_voltage_graph.list()).toHaveLength(0)
})
