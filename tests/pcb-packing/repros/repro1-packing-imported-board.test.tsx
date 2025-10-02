import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { RaspberryPiHatBoard } from "../RaspberryPiHat"

test("repro1-packing-imported-board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <RaspberryPiHatBoard name="RaspberryPiHat">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </RaspberryPiHatBoard>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
