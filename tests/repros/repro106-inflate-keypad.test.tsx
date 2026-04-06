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

  const originalJson = keypadCircuitJson
  const inflatedJson = circuit.getCircuitJson()

  const originalErrorCount = originalJson.filter((el) =>
    el?.type?.includes("error"),
  ).length

  const inflatedErrorCount = inflatedJson.filter((el) =>
    el?.type?.includes("error"),
  ).length

  console.log("Original error count:", originalErrorCount)
  console.log("Inflated error count:", inflatedErrorCount)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  // expect(originalErrorCount).toBe(0)
  // expect(inflatedErrorCount).toBe(0)
})
