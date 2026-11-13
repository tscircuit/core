import { expect, test } from "bun:test"
import { simulation } from "lib/namespaced-elements"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("invalid explicit durations report the RFC diagnostic and emit no block", async () => {
  for (const duration of [0, -1, Infinity, NaN, "-1ns", "0UI", "1e400s"]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <simulation.pcbtransientchannelsimulation
          bitRate="20Mbps"
          duration={duration}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.source_failed_to_create_component_error.list()[0]?.message,
    ).toContain("duration must be finite and greater than zero.")
    expect(circuit.db.simulation_signal_integrity.list()).toHaveLength(0)
  }
})
