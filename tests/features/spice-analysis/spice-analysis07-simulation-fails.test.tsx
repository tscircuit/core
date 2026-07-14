import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "a singular simulation should produce a classified non-convergent error",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board schMaxTraceDistance={10} routingDisabled>
        <voltagesource name="V1" voltage="5V" />
        {/* Shorting a voltage source will cause the simulation to fail */}
        <trace from=".V1 > .terminal1" to=".V1 > .terminal2" />
        <analogsimulation duration="1ms" />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.simulation_experiment_error.list()).toEqual([
      expect.objectContaining({
        error_code: "non_convergent",
        message: "Singular matrix (real)",
        is_fatal: true,
      }),
    ])
    expect(circuit.db.simulation_unknown_experiment_error.list()).toHaveLength(
      0,
    )
  },
  { timeout: 20000 },
)
