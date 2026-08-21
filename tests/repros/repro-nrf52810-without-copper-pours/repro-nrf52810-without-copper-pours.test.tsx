import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Nrf52810Circuit from "./nrf52810-circuit"

// Reproduces https://tscircuit.com/seveibar/nrf52810#files without copper pours.
test("nRF52810 tracker routes without copper pours", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<Nrf52810Circuit />)
  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
