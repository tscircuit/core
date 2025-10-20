import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("pcb autolayout out of board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="25.4mm" height="25.4mm">
      <chip name="U1" footprint="soic8_pillpads" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // console.log(circuitJson)

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
