import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import keypadCircuitJson from "tests/repros/assets/keypad.json"

test("repro-keypad-errors-comparison", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="100mm"
      height="100mm"
      circuitJson={keypadCircuitJson}
    ></board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
