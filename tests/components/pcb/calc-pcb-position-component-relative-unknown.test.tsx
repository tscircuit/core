import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc errors on unknown component references", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        pcbX="calc(R999.maxX + 2mm)"
      />
    </board>,
  )

  try {
    circuit.render()
    throw new Error("render should have thrown")
  } catch (error) {
    expect((error as Error).message).toContain("unknown component reference")
    expect((error as Error).message).toContain("R999")
  }
})
