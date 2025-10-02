import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MicroModBoard } from "../fixtures/MicroModBoard"
import GreenpillBoard from "../fixtures/greenpill"

test("repro1-packing-imported-board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <MicroModBoard name="MicroMod">
      <GreenpillBoard name="Greenpill" />
    </MicroModBoard>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
