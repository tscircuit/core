import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "a failing simulation should produce a simulation_unknown_experiment_error",
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

    const circuitJson = circuit.getCircuitJson()

    expect(
      circuitJson.some(
        (el) => el.type === "simulation_unknown_experiment_error",
      ),
    ).toBe(true)

    const errorEl = circuitJson.find(
      (el) => el.type === "simulation_unknown_experiment_error",
    )

    expect(errorEl).toBeDefined()
  },
  { timeout: 20000 },
)
