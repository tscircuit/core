import { expect, test } from "bun:test"
import { doBoundsOverlap } from "@tscircuit/math-utils"
import { getPcbTextBounds } from "lib/components/base-components/NormalComponent/utils/getPcbTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

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
  // Both top (y > 0) and bottom (y < 0) at x = 0 are occupied by R_TOP and R_BOT,
  // so R1's label should move horizontally to a clear side (|x| > 0.8)
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
      {/* Near top board edge (y = +3mm): default top label would extend outside board */}
      <resistor
        name="R_EDGE"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={2.4}
      />
      {/* Stacked pair where flipping R_UPPER downward would collide with R_LOWER's top label */}
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

  // R_EDGE label must be flipped inside the board (y < 2.4, top edge is +3.0)
  const edgeBounds = getPcbTextBounds(rEdgeText!)
  expect(edgeBounds.y + edgeBounds.height).toBeLessThanOrEqual(3.0)

  // R_UPPER and R_LOWER labels must not overlap each other
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
      {/* Manual pcbSx position must never be overwritten even when overlapped */}
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

      {/* pcbStyle.silkscreenTextPosition = "centered" */}
      <resistor
        name="R_CENTERED"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        pcbStyle={{ silkscreenTextPosition: "centered" }}
      />

      {/* pcbStyle.silkscreenTextPosition = "none" */}
      <resistor
        name="R_NONE"
        resistance="10k"
        footprint="0402"
        pcbX={4}
        pcbY={0}
        pcbStyle={{ silkscreenTextPosition: "none" }}
      />

      {/* pcbStyle.silkscreenTextPosition = { offsetX, offsetY } */}
      <resistor
        name="R_OFFSET"
        resistance="10k"
        footprint="0402"
        pcbX={8}
        pcbY={0}
        pcbStyle={{ silkscreenTextPosition: { offsetX: 1.5, offsetY: -2.0 } }}
      />

      {/* pcbStyle.silkscreenTextPosition = "outside" enables adjustment on non-passives like LED */}
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

  // D1 is at y = -5 with R_LED_BLOCK at y = -3.8 above it, so D1's label flips below y = -5
  expect(ledText?.anchor_position.y).toBeLessThan(-5)
})
