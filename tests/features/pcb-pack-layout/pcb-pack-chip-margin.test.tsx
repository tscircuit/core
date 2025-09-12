import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack forwards component pcbMargin to calculate-packing", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack pcbGap="0mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbMarginX="3mm"
        pcbMarginY="3mm"
      />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
