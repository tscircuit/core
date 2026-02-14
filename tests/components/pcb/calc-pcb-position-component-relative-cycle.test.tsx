import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc errors on circular component-relative references", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        pcbX="calc(R2.maxX + 1mm)"
      />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        pcbX="calc(R1.maxX + 1mm)"
      />
    </board>,
  )

  try {
    circuit.render()
    throw new Error("render should have thrown")
  } catch (error) {
    expect((error as Error).message).toContain(
      "Circular pcb position calc references",
    )
    expect((error as Error).message).toContain("R1")
    expect((error as Error).message).toContain("R2")
  }
})
