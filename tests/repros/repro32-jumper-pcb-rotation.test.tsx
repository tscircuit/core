import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Jumper with pcbRotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <jumper name="J1" footprint="m2host" pcbRotation="-90deg" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
