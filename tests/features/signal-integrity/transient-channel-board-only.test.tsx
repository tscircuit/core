import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("transient channel simulations must be direct board children", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <group>
        <simulation.pcbtransientchannelsimulation bitRate="100Mbps" />
      </group>
    </board>,
  )

  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "<simulation.pcbtransientchannelsimulation> must be a direct child of <board>",
  )
})
