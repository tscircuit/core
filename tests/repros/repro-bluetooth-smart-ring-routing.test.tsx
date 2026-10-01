import { expect, test } from "bun:test"
import BluetoothSmartRingFlex from "tests/fixtures/bluetooth-smart-ring"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smart ring routing preserves required connections", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<BluetoothSmartRingFlex />)
  await circuit.renderUntilSettled()
  const errors = circuit
    .getCircuitJson()
    .filter((element) => element.type.endsWith("_error"))
  expect(errors).toEqual([])
}, 60_000)
