import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("restoring an unsupported simulation record fails instead of dropping it", async () => {
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
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Cannot restore simulation records: unsupported element type "simulation_transient_voltage_graph".',
  )
})
