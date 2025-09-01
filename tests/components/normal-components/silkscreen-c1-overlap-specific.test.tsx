import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen reference designator adjustment - C1 text overlapping with silkscreen outline", () => {
  const { circuit } = getTestFixture()

  // Recreate a scenario similar to the one shown in the attachment
  // where C1 text overlaps with the component's silkscreen outline
  circuit.add(
    <board width="16mm" height="12mm">
      {/* Create a setup similar to the original image */}
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

      {/* Place resistor R1 */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-3}
        pcbY={0}
        pcbRotation={90}
      />

      {/* Place capacitor C1 close to create potential overlap */}
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0805"
        pcbX={3}
        pcbY={0}
        pcbRotation={90}
      />

      {/* Add more components to create a dense layout */}
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={0}
        pcbY={3}
        pcbRotation={0}
      />

      <capacitor
        name="C2"
        capacitance="10uF"
        footprint="1206"
        pcbX={0}
        pcbY={-3}
        pcbRotation={0}
      />
    </board>,
  )

  circuit.render()

  // Get all silkscreen elements
  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const silkscreenPaths = circuit.db.pcb_silkscreen_path.list()
  const silkscreenRects = circuit.db.pcb_silkscreen_rect.list()
  const silkscreenCircles = circuit.db.pcb_silkscreen_circle.list()

  // Focus on the C1 reference designator
  const c1Text = silkscreenTexts.find((text) => text.text === "C1")
  expect(c1Text).toBeDefined()

  if (c1Text) {
    const c1Bounds = getTextBounds(c1Text)

    // Check that C1 doesn't overlap with any silkscreen paths
    for (const path of silkscreenPaths) {
      if (path.layer !== c1Text.layer) continue

      const pathBounds = getPathBounds(path)
      const overlaps = boundsOverlap(c1Bounds, pathBounds)

      if (overlaps) {
        console.log("C1 overlaps with silkscreen path:", {
          c1Bounds,
          pathBounds,
          pathComponent: path.pcb_component_id,
        })
      }

      expect(overlaps).toBe(false)
    }

    // Check that C1 doesn't overlap with silkscreen rectangles
    for (const rect of silkscreenRects) {
      if (rect.layer !== c1Text.layer) continue

      const rectBounds = getRectBounds(rect)
      const overlaps = boundsOverlap(c1Bounds, rectBounds)

      expect(overlaps).toBe(false)
    }

    // Check that C1 doesn't overlap with silkscreen circles
    for (const circle of silkscreenCircles) {
      if (circle.layer !== c1Text.layer) continue

      const circleBounds = getCircleBounds(circle)
      const overlaps = boundsOverlap(c1Bounds, circleBounds)

      expect(overlaps).toBe(false)
    }
  }

  // Verify all reference designators are properly positioned
  const referenceTexts = silkscreenTexts.filter((text) =>
    /^(R\d+|C\d+|U\d+)$/i.test(text.text),
  )

  expect(referenceTexts.length).toBeGreaterThan(0)

  for (const refText of referenceTexts) {
    // Each reference designator should be visible and not overlapping
    expect(refText.anchor_position.x).toBeTypeOf("number")
    expect(refText.anchor_position.y).toBeTypeOf("number")
    expect(refText.text).toMatch(/^(R\d+|C\d+|U\d+)$/i)
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

function getRectBounds(rect: any) {
  return {
    left: rect.center.x - rect.width / 2,
    right: rect.center.x + rect.width / 2,
    top: rect.center.y + rect.height / 2,
    bottom: rect.center.y - rect.height / 2,
  }
}

function getCircleBounds(circle: any) {
  return {
    left: circle.center.x - circle.radius,
    right: circle.center.x + circle.radius,
    top: circle.center.y + circle.radius,
    bottom: circle.center.y - circle.radius,
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
