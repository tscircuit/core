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

  // Get all silkscreen text elements
  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  // Find reference designator texts
  const referenceTexts = silkscreenTexts.filter((text) =>
    /^(R\d+|C\d+)$/i.test(text.text),
  )

  expect(referenceTexts.length).toBeGreaterThan(0)

  // Check that reference designators don't overlap with silkscreen paths
  const silkscreenPaths = circuit.db.pcb_silkscreen_path.list()

  for (const refText of referenceTexts) {
    const textBounds = getTextBounds(refText)

    for (const path of silkscreenPaths) {
      if (
        path.pcb_component_id === refText.pcb_component_id ||
        path.layer !== refText.layer
      ) {
        continue // Skip same component or different layer
      }

      const pathBounds = getPathBounds(path)
      const overlaps = boundsOverlap(textBounds, pathBounds)

      expect(overlaps).toBe(false)
    }
  }

  // Verify that the PCB can be rendered without errors
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

// Helper functions for bounds calculation
function getTextBounds(text: any) {
  const charWidth = 0.6 * text.font_size
  const textWidth = text.text.length * charWidth
  const textHeight = text.font_size

  return {
    left: text.anchor_position.x - textWidth / 2,
    right: text.anchor_position.x + textWidth / 2,
    top: text.anchor_position.y + textHeight / 2,
    bottom: text.anchor_position.y - textHeight / 2,
  }
}

function getPathBounds(path: any) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity

  for (const point of path.route) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  const padding = path.stroke_width / 2
  return {
    left: minX - padding,
    right: maxX + padding,
    top: maxY + padding,
    bottom: minY - padding,
  }
}

function boundsOverlap(a: any, b: any): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom > b.top ||
    a.top < b.bottom
  )
}
