import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example33 3d snapshot with chip and jumper", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="15mm">
      <chip name="U1" footprint="soic8" pcbX={-5} pcbY={0} />
      <jumper name="J1" pinCount={3} footprint="pinrow3" pcbX={5} pcbY={0} />
      <trace from=".U1 .pin1" to=".J1 .pin1" />
      <trace from=".U1 .pin2" to=".J1 .pin2" />
      <trace from=".U1 .pin3" to=".J1 .pin3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
