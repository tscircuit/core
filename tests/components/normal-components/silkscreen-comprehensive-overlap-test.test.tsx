import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen reference designator adjustment similar to original issue", () => {
  const { circuit } = getTestFixture()

  // Create a circuit similar to the one in the original issue with overlapping silkscreen
  circuit.add(
    <board width="20mm" height="15mm">
      {/* Create components that would cause overlapping similar to the image */}
      <chip
        name="U1"
        footprint="soic8"
        pcbX={0}
        pcbY={0}
        pinLabels={{
          1: "VCC",
          2: "OUT",
          3: "DISCH",
          4: "GND",
          5: "GND",
          6: "TRIG",
          7: "RST",
          8: "VCC",
        }}
      />

      {/* Position resistors close to the chip to force overlaps */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-4}
        pcbY={2}
        pcbRotation={0}
      />

      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={4}
        pcbY={2}
        pcbRotation={0}
      />

      {/* Position capacitors that might overlap */}
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="1206"
        pcbX={0}
        pcbY={4}
        pcbRotation={90}
      />

      <capacitor
        name="C2"
        capacitance="0.01uF"
        footprint="0805"
        pcbX={0}
        pcbY={-4}
        pcbRotation={0}
      />
    </board>,
  )

  circuit.render()

  // Get all silkscreen elements
  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const silkscreenPaths = circuit.db.pcb_silkscreen_path.list()

  // Find reference designator texts
  const referenceTexts = silkscreenTexts.filter((text) =>
    /^(R\d+|C\d+)$/i.test(text.text),
  )

  expect(referenceTexts.length).toBeGreaterThan(0)

  // Verify no overlaps between reference texts and silkscreen paths
  for (const refText of referenceTexts) {
    const textBounds = getTextBounds(refText)

    for (const path of silkscreenPaths) {
      // Skip if different layer or same component
      if (path.layer !== refText.layer) continue

      const pathBounds = getPathBounds(path)
      const overlaps = boundsOverlap(textBounds, pathBounds)

      if (overlaps) {
        console.log(
          `Overlap detected between ${refText.text} and path from component ${path.pcb_component_id}`,
        )
        console.log(`Text bounds:`, textBounds)
        console.log(`Path bounds:`, pathBounds)
      }

      expect(overlaps).toBe(false)
    }
  }

  // Also check that reference designators don't overlap with each other
  for (let i = 0; i < referenceTexts.length; i++) {
    for (let j = i + 1; j < referenceTexts.length; j++) {
      const textA = referenceTexts[i]
      const textB = referenceTexts[j]

      if (textA.layer !== textB.layer) continue

      const boundsA = getTextBounds(textA)
      const boundsB = getTextBounds(textB)
      const overlaps = boundsOverlap(boundsA, boundsB)

      if (overlaps) {
        console.log(`Overlap detected between ${textA.text} and ${textB.text}`)
      }

      expect(overlaps).toBe(false)
    }
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

// Helper functions
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
  if (path.route.length === 0) return { left: 0, right: 0, top: 0, bottom: 0 }

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
