import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ViaGridBoard } from "@tscircuit/common"
import { RP2040 } from "tests/fixtures/assets/RP2040.tsx"

test("ViaGridBoard ", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <ViaGridBoard name="VIA_GRID_BOARD">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <RP2040 name="U1" />
    </ViaGridBoard>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  Bun.write("circuit.json", JSON.stringify(circuitJson, null, 2))

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
