import { doBoundsOverlap } from "@tscircuit/math-utils"
import { expect, test } from "bun:test"
import { getPcbTextBounds } from "lib/components/base-components/NormalComponent/utils/getPcbTextBounds"
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

test("moves refdes label to orthogonal side when both default and flipped positions hit obstacles", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      pcbStyle={{ silkscreenTextPosition: "outside" }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
      <resistor
        name="R_TOP"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={1.1}
      />
      <resistor
        name="R_BOT"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={-1.1}
      />
    </board>,
  )

  circuit.render()

  const r1Text = circuit.db.pcb_silkscreen_text
    .list()
    .find((t) => t.text === "R1")
  expect(r1Text).toBeDefined()
  expect(Math.abs(r1Text!.anchor_position.x)).toBeGreaterThan(0.8)
})

test("avoids colliding with another component's silkscreen label and stays inside board bounds", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="12mm"
      height="6mm"
      pcbStyle={{ silkscreenTextPosition: "outside" }}
    >
      <resistor
        name="R_EDGE"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={2.4}
      />
      <resistor
        name="R_BLOCK"
        resistance="10k"
        footprint="0402"
        pcbX={3}
        pcbY={1.1}
      />
      <resistor
        name="R_UPPER"
        resistance="10k"
        footprint="0402"
        pcbX={3}
        pcbY={0}
      />
      <resistor
        name="R_LOWER"
        resistance="10k"
        footprint="0402"
        pcbX={3}
        pcbY={-2.2}
      />
    </board>,
  )

  circuit.render()

  const texts = circuit.db.pcb_silkscreen_text.list()
  const rEdgeText = texts.find((t) => t.text === "R_EDGE")
  const rUpperText = texts.find((t) => t.text === "R_UPPER")
  const rLowerText = texts.find((t) => t.text === "R_LOWER")

  expect(rEdgeText).toBeDefined()
  expect(rUpperText).toBeDefined()
  expect(rLowerText).toBeDefined()

  const edgeBounds = getPcbTextBounds(rEdgeText!)
  expect(edgeBounds.y + edgeBounds.height).toBeLessThanOrEqual(3.0)

  const upperBounds = getPcbTextBounds(rUpperText!)
  const lowerBounds = getPcbTextBounds(rLowerText!)
  expect(
    doBoundsOverlap(
      {
        minX: upperBounds.x,
        minY: upperBounds.y,
        maxX: upperBounds.x + upperBounds.width,
        maxY: upperBounds.y + upperBounds.height,
      },
      {
        minX: lowerBounds.x,
        minY: lowerBounds.y,
        maxX: lowerBounds.x + lowerBounds.width,
        maxY: lowerBounds.y + lowerBounds.height,
      },
    ),
  ).toBe(false)
})

test("does not move labels placed manually via pcbSx and supports pcbStyle.silkscreenTextPosition", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <resistor
        name="R_MANUAL"
        resistance="10k"
        footprint="0402"
        pcbX={-8}
        pcbY={0}
        pcbSx={{
          "& silkscreentext": {
            pcbX: 0,
            pcbY: 1.1,
          } as any,
        }}
      />
      <resistor
        name="R_OBSTACLE"
        resistance="10k"
        footprint="0402"
        pcbX={-8}
        pcbY={1.1}
      />
      <resistor
        name="R_CENTERED"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        pcbStyle={{ silkscreenTextPosition: "centered" }}
      />
      <resistor
        name="R_NONE"
        resistance="10k"
        footprint="0402"
        pcbX={4}
        pcbY={0}
        pcbStyle={{ silkscreenTextPosition: "none" }}
      />
      <resistor
        name="R_OFFSET"
        resistance="10k"
        footprint="0402"
        pcbX={8}
        pcbY={0}
        pcbStyle={{ silkscreenTextPosition: { offsetX: 1.5, offsetY: -2.0 } }}
      />
      <led
        name="D1"
        footprint="0603"
        pcbX={0}
        pcbY={-5}
        pcbStyle={{ silkscreenTextPosition: "outside" }}
      />
      <resistor
        name="R_LED_BLOCK"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={-3.8}
      />
    </board>,
  )

  circuit.render()

  const texts = circuit.db.pcb_silkscreen_text.list()
  const manualText = texts.find((t) => t.text === "R_MANUAL")
  const centeredText = texts.find((t) => t.text === "R_CENTERED")
  const noneText = texts.find((t) => t.text === "R_NONE")
  const offsetText = texts.find((t) => t.text === "R_OFFSET")
  const ledText = texts.find((t) => t.text === "D1")

  expect(manualText?.anchor_position.x).toBeCloseTo(-8)
  expect(manualText?.anchor_position.y).toBeCloseTo(1.1)

  expect(centeredText?.anchor_position.x).toBeCloseTo(0)
  expect(centeredText?.anchor_position.y).toBeCloseTo(0)

  expect(noneText).toBeUndefined()

  expect(offsetText?.anchor_position.x).toBeCloseTo(8 + 1.5)
  expect(offsetText?.anchor_position.y).toBeLessThan(0)

  expect(ledText?.anchor_position.y).toBeLessThan(-5)
})
