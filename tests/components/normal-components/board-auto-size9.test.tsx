import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const within = (value: number, min: number, max: number) => {
  expect(value).toBeGreaterThanOrEqual(min)
  expect(value).toBeLessThanOrEqual(max)
}

test("board anchor alignment holds when pcbPack auto-sizes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      pcbPack
      pcbGap="1mm"
      boardAnchorAlignment="top_left"
      boardAnchorPosition={{ x: -20, y: 15 }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="1uF" footprint="0402" />
      <fabricationnotetext
        text="top_left"
        anchorAlignment="top_left"
        pcbX={-20}
        pcbY={15}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
