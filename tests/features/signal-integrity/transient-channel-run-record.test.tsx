import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB transient simulation records the run settings", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <simulation.pcbtransientchannelsimulation
        name="LINK"
        bitRate="100Mbps"
        duration="16UI"
        allowUnroutedTraces
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const [run] = circuit.db.simulation_pcb_transient_channel_simulation.list()
  expect(run).toMatchObject({
    name: "LINK",
    bit_rate_bps: 100_000_000,
    allow_unrouted_traces: true,
  })
  expect(run.duration_ms).toBeCloseTo(0.00016, 12)
})
