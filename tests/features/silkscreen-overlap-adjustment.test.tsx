import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic silkscreen reference designator adjustment for overlapping passives", () => {
  const { circuit } = getTestFixture()

  // Create a circuit with components that would likely cause overlapping reference designators
  circuit.add(
    <board width="25mm" height="15mm">
      {/* Place components close together to force overlaps */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={0}
        pcbY={0}
        pcbRotation={0}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0805"
        pcbX={3}
        pcbY={0}
        pcbRotation={90}
      />
      <resistor
        name="R3"
        resistance="22k"
        footprint="0805"
        pcbX={6}
        pcbY={0}
        pcbRotation={0}
      />

      {/* Add more components to test various scenarios */}
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={-3}
        pcbRotation={45}
      />
      <capacitor
        name="C2"
        capacitance="10uF"
        footprint="1206"
        pcbX={3}
        pcbY={-3}
        pcbRotation={0}
      />
    </board>,
  )

  circuit.render()

  // Get the silkscreen text elements
  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  // Should have silkscreen text for each passive component
  const r1Text = silkscreenTexts.find((text) => text.text === "R1")
  const c1Text = silkscreenTexts.find((text) => text.text === "C1")
  const r2Text = silkscreenTexts.find((text) => text.text === "R2")
  const r3Text = silkscreenTexts.find((text) => text.text === "R3")
  const c2Text = silkscreenTexts.find((text) => text.text === "C2")

  expect(r1Text).toBeDefined()
  expect(c1Text).toBeDefined()
  expect(r2Text).toBeDefined()
  expect(r3Text).toBeDefined()
  expect(c2Text).toBeDefined()

  // The silkscreen text should be positioned to avoid overlapping with other components
  // This test primarily verifies the feature runs without errors
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
