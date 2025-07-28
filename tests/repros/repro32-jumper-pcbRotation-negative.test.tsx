import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Reproduce bug with pcbRotation string containing negative degrees

test("jumper m2host pcbRotation negative string", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <jumper name="J1" footprint="m2host" pcbRotation="-90deg" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
