import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("eye diagrams must be direct board children", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <group>
        <simulation.eyediagram name="eye" simulationRef="LINK" />
      </group>
    </board>,
  )

  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "<simulation.eyediagram> must be a direct child of <board>",
  )
})
