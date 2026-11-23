import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import WifiSounder from "./assets/wifi-sounder"

test("Wi-Fi sounder schematic with manual placements inside a sheet", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<WifiSounder />)
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
